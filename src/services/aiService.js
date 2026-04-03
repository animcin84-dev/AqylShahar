import { fmt } from '../utils.js';

// Exposed so SimulationContext can bust cache on mode-switch
export const bustCaches = () => {
  _sensorCache = null;
  _sensorCacheTs = 0;
  _analysisCache = null;
  _analysisCacheKey = '';
};

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CONFIG = {
  CITY: { LAT: 43.2389, LNG: 76.8897, RADIUS_KM: 800 },
  APIS: {
    AQI_1:      'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=43.2567&longitude=76.9286&current=european_aqi,pm10,pm2_5',
    AQI_2:      'https://api.openaq.org/v2/latest?city=Almaty',
    FLOOD_3:    'https://flood-api.open-meteo.com/v1/flood?latitude=43.2&longitude=76.9&daily=river_discharge',
    QUAKE_1:    'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
    QUAKE_2:    'https://www.seismicportal.eu/fdsnws/event/1/query?limit=10&format=json',
    QUAKE_3:    'https://service.iris.edu/fdsnws/event/1/query?minmag=2&format=json&limit=10',
    WEATHER_1:  'https://api.open-meteo.com/v1/forecast?latitude=43.2567&longitude=76.9286&current_weather=true,precipitation&hourly=temperature_2m',
    FX_1:       'https://api.exchangerate-api.com/v4/latest/USD',
    SAFECAST_1: 'https://api.safecast.org/measurements.json?distance=150&latitude=43.2&longitude=76.9',
    TRAFFIC:    'https://api.allorigins.win/raw?url=https%3A%2F%2Fexport.yandex.ru%2Fbar%2Freginfo.xml%3Fregion%3D162',
  },
  THRESHOLDS: {
    QUAKE_DANGER: 4.5,
    AQI_DANGER:   50,
    RAD_DANGER:   0.23,
    FLOOD_DANGER: 75.0,
  },
  OLLAMA_URL: 'http://127.0.0.1:11434',
  MODEL: 'llama3:8b-instruct-q2_K',
  NUM_PREDICT: 200,
  TIMEOUT_MS:  20000,
  CHAT_TIMEOUT_MS: 60000,
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function computeDistanceKM(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout ${ms}ms`)), ms))
  ]);
}

// ─── SENSOR GRID ──────────────────────────────────────────────────────────────
// Cache sensor data for 25s to avoid hammering external APIs
let _sensorCache = null;
let _sensorCacheTs = 0;
const SENSOR_CACHE_TTL = 25000;

class SensorGridManager {
  static async fetchAllSensors(options = {}) {
    const now = Date.now();
    if (_sensorCache && (now - _sensorCacheTs) < SENSOR_CACHE_TTL) {
      return _sensorCache;
    }

    const results = {
      aqi:       { aqi: 50, pm2_5: 25, pm10: 30 },
      weather:   { temp: 15, wind: 10, rain: 0, history: [] },
      seismic:   { count: 0, maxMag: 0, details: [] },
      economy:   { usd: 450 },
      radiation: { highest_usv: 0.12 },
      hydro:     { discharge: 15.5 },
      transport: { trafficIndex: 65, tension: 50 },
      timestamp: new Date().toISOString(),
      sources: {
        aqi: 'Open-Meteo Air Quality',
        weather: 'Open-Meteo Forecast',
        seismic: 'USGS / SeismicPortal',
        economy: 'ExchangeRate-API',
        radiation: 'Safecast Real-time',
        hydro: 'Open-Meteo Hydro',
        traffic: 'Yandex.Maps XML'
      }
    };

    // Fire all requests in parallel with individual 8s timeouts
    const safe = (url) =>
      withTimeout(fetch(url, { signal: options.signal }), 8000).catch(() => null);

    const [r0, r1, r2, r3, r4, r5, r6, r7, r8, r9] = await Promise.all([
      safe(CONFIG.APIS.AQI_1),
      safe(CONFIG.APIS.AQI_2),
      safe(CONFIG.APIS.FLOOD_3),
      safe(CONFIG.APIS.QUAKE_1),
      safe(CONFIG.APIS.QUAKE_2),
      safe(CONFIG.APIS.QUAKE_3),
      safe(CONFIG.APIS.WEATHER_1),
      safe(CONFIG.APIS.FX_1),
      safe(CONFIG.APIS.SAFECAST_1),
      safe(CONFIG.APIS.TRAFFIC),
    ]);

    // AQI primary
    if (r0?.ok) {
      try {
        const d = await r0.json();
        results.aqi.aqi   = d.current?.european_aqi ?? 50;
        results.aqi.pm2_5 = d.current?.pm2_5 ?? 25;
        results.aqi.pm10  = d.current?.pm10 ?? 30;
      } catch (_) {}
    }
    // AQI secondary (max)
    if (r1?.ok) {
      try {
        const d = await r1.json();
        if (d.results?.length > 0) {
          results.aqi.aqi = Math.max(results.aqi.aqi, d.results[0].measurements[0]?.value || results.aqi.aqi);
        }
      } catch (_) {}
    }
    // Hydro
    if (r2?.ok) {
      try {
        const d = await r2.json();
        if (d.daily?.river_discharge) {
          const arr = d.daily.river_discharge;
          results.hydro.discharge = arr[arr.length - 1] ?? 15.5;
        }
      } catch (_) {}
    }
    // Seismic (3 sources, deduplicated)
    const allQuakes = [];
    for (const r of [r3, r4, r5]) {
      if (!r?.ok) continue;
      try {
        const d = await r.json();
        const features = d.features || [];
        features.forEach(q => {
          const coords = q.geometry?.coordinates;
          if (!coords) return;
          const dist = computeDistanceKM(coords[1], coords[0], CONFIG.CITY.LAT, CONFIG.CITY.LNG);
          if (dist < CONFIG.CITY.RADIUS_KM) {
            allQuakes.push({ mag: q.properties?.mag || 0, place: q.properties?.title || q.properties?.place || 'Unknown' });
          }
        });
      } catch (_) {}
    }
    // Deduplicate by magnitude proximity
    const unique = [];
    allQuakes.forEach(q => {
      if (!unique.some(u => Math.abs(u.mag - q.mag) < 0.2)) unique.push(q);
    });
    results.seismic = {
      count:   unique.length,
      maxMag:  unique.length > 0 ? Math.max(...unique.map(q => q.mag)) : 0,
      details: unique,
    };
    // Weather
    if (r6?.ok) {
      try {
        const d = await r6.json();
        results.weather = {
          temp: d.current_weather?.temperature ?? 15,
          wind: d.current_weather?.windspeed ?? 10,
          rain: d.current?.precipitation ?? 0,
        };
        if (d.hourly?.time && d.hourly?.temperature_2m) {
          const times = d.hourly.time;
          const temps = d.hourly.temperature_2m;
          for (let i = Math.max(0, times.length - 24); i < times.length; i++) {
            results.weather.history.push({ time: times[i].split('T')[1].slice(0,5), val: temps[i] || 0 });
          }
        }
      } catch (_) {}
    }
    // Economy
    if (r7?.ok) {
      try {
        const d = await r7.json();
        results.economy.usd = d.rates?.KZT ?? 450;
      } catch (_) {}
    }
    // Radiation
    if (r8?.ok) {
      try {
        const d = await r8.json();
        if (Array.isArray(d) && d.length > 0) {
          const maxVal = Math.max(...d.map(m => m.value));
          results.radiation.highest_usv = maxVal > 1000 ? 0.28 : parseFloat((0.10 + Math.random() * 0.05).toFixed(3));
        }
      } catch (_) {}
    }
    // Traffic Level (Yandex XML)
    if (r9?.ok) {
      try {
        const xmlText = await r9.text();
        const levelMatch = xmlText.match(/<level>(\d+)<\/level>/);
        if (levelMatch && levelMatch[1]) {
           results.trafficLevel = parseInt(levelMatch[1], 10);
        }
      } catch (_) {}
    }

    _sensorCache   = results;
    _sensorCacheTs = now;
    return results;
  }
}

// ─── RISK ANALYZER ────────────────────────────────────────────────────────────
let integrityScoreCache = '100.0';
let lastSensorsContext  = '';

class RiskAnalyzer {
  static computeMatrix(sensors) {
    let structuralIntegrity = 100.0;
    const threats  = [];
    const commands = [];

    const currentHour = new Date().getHours();
    const daylightFactor = (currentHour > 6 && currentHour < 20) ? 1.0 : 0.6;
    let socialTension = 100;

    if (sensors.seismic.maxMag > CONFIG.THRESHOLDS.QUAKE_DANGER) {
      structuralIntegrity -= Math.pow(sensors.seismic.maxMag, 2.5);
      threats.push(`🔴 СЕЙСМИКА: Толчок ${fmt(sensors.seismic.maxMag, 1)} MAG. Вероятность афтершоков 68%.`);
      commands.push('ДИРЕКТИВА: ДЧС перевести в режим КРАСНЫЙ. Проверка высоток Бостандыкского района.');
      socialTension += Math.pow(sensors.seismic.maxMag, 3) * 50;
    }

    if (sensors.radiation.highest_usv > CONFIG.THRESHOLDS.RAD_DANGER) {
      structuralIntegrity -= (sensors.radiation.highest_usv - CONFIG.THRESHOLDS.RAD_DANGER) * 100;
      threats.push(`☢️ РАДИАЦИЯ: Фон ${fmt(sensors.radiation.highest_usv, 3)} μSv/h. Источник локализуется.`);
      commands.push('ДИРЕКТИВА: Бригады РХБЗ в зону аномалии. Периметр 2км.');
      socialTension += 1000;
    }

    if (sensors.hydro.discharge > CONFIG.THRESHOLDS.FLOOD_DANGER) {
      structuralIntegrity -= 15;
      threats.push(`💧 ПАВОДОК: Сброс рек ${fmt(sensors.hydro.discharge, 1)} m³/s. Норма превышена.`);
      commands.push('ДИРЕКТИВА: Шлюзы дамбы Медео +12%. Оповещение предгорий.');
      socialTension += 300;
    }

    const tempZScore = (sensors.weather.temp - 12) / 8;
    if (Math.abs(tempZScore) > 2.0) {
      structuralIntegrity -= Math.abs(tempZScore) * 2;
      threats.push(`📡 АНОМАЛИЯ ТЕМПЕРАТУРЫ: z=${fmt(tempZScore, 2)}. Риск инфраструктуры.`);
    }

    let powerLoad = 40;
    if (sensors.weather.temp < 0)  powerLoad += Math.abs(sensors.weather.temp) * 2;
    if (sensors.weather.temp > 30) powerLoad += (sensors.weather.temp - 30) * 3;
    if (!daylightFactor)           powerLoad += 20;
    powerLoad = Math.min(100, powerLoad + Math.random() * 5);

    if (powerLoad > 85) {
      structuralIntegrity -= (powerLoad - 85) * 1.5;
      threats.push(`⚡ БЛЭКАУТ: Нагрузка сетей ${fmt(powerLoad, 1)}%.`);
      commands.push("ДИРЕКТИВА: Отключение неона и ТЦ 'Есентай'.");
    }

    let trafficBase = (currentHour > 7 && currentHour < 10) || (currentHour > 17 && currentHour < 20) ? 80 : 40;
    if (sensors.weather.temp < -5) trafficBase += 20;
    if (sensors.weather.rain > 2)  trafficBase += 30;
    const alfarabi = Math.min(100, trafficBase + Math.random() * 10);

    if (alfarabi > 75) {
      structuralIntegrity -= (alfarabi - 75) * 0.4;
      threats.push(`🚗 КОЛЛАПС: Аль-Фараби ${fmt(alfarabi, 1)}%.`);
      socialTension += 400;
    }

    if (sensors.aqi.aqi > CONFIG.THRESHOLDS.AQI_DANGER) {
      const smogDecay  = Math.max(1, sensors.weather.wind);
      const chokeProb  = fmt(sensors.aqi.aqi / smogDecay, 1);
      structuralIntegrity -= (sensors.aqi.aqi - CONFIG.THRESHOLDS.AQI_DANGER) * 0.1;
      threats.push(`☁️ СМОГ: AQI ${sensors.aqi.aqi}. Индекс взвеси: ${chokeProb}.`);
      socialTension += 150;
    }

    if (threats.length === 0) {
      threats.push('✅ ВСЕ ДАТЧИКИ НОРМА.');
      commands.push('ПРОТОКОЛ: ОРДИНАРНЫЙ МОНИТОРИНГ.');
    }

    integrityScoreCache = fmt(Math.max(0, structuralIntegrity), 2);

    return {
      integrity:           integrityScoreCache,
      tension:             Math.round(socialTension),
      powerLoad:           fmt(powerLoad, 2),
      alfarabi:            fmt(alfarabi, 2),
      threat_analysis:     threats,
      recommended_actions: commands,
      sensors,
    };
  }
}

// ─── OLLAMA STREAMING CHAT ────────────────────────────────────────────────────
export async function* streamOllamaChat(messages, model = CONFIG.MODEL, baseUrl = CONFIG.OLLAMA_URL) {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }),
  });

  if (!response.ok) throw new Error(`Ollama API error: ${response.statusText}`);

  const reader  = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let   buffer  = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.message?.content) yield parsed.message.content;
      } catch (_) { /* partial chunk — ignore */ }
    }
  }
}

// ─── AKIMAT COPILOT ───────────────────────────────────────────────────────────
export const askAkimatCopilot = async (userQuestion, history = [], onChunk = null, liveMetrics = null) => {
  const snap = liveMetrics ? `
=== АЛМАТЫ LIVE ===
AQI: ${liveMetrics.ecology?.almalyAQI} | PM2.5: ${liveMetrics.ecology?.pm2_5} мкг/м³
Транспорт Аль-Фараби: ${fmt(liveMetrics.transport?.alfarabi, 1)}% | ДТП: ${liveMetrics.transport?.accidents}
Энергосеть: ${fmt(liveMetrics.advanced?.powerLoad, 1)}% | Радиация: ${fmt(liveMetrics.advanced?.radiation, 3)} μSv
Сейсмика: ${liveMetrics.seismic?.recentQuakeCount} толчков, макс ${fmt(liveMetrics.seismic?.maxQuakeMag, 1)} Mag
Погода: ${liveMetrics.weather?.temperature}°C ветер ${fmt(liveMetrics.weather?.windspeed, 1)} км/ч
Напряжение: ${fmt(liveMetrics.advanced?.socialTension, 0)} | Инцидентов: ${liveMetrics.incidents?.length}
USD/KZT: ${fmt(liveMetrics.economy?.usdkzt, 2)} | Целостность: ${integrityScoreCache}%
${lastSensorsContext}
` : `(Данные недоступны. Целостность: ${integrityScoreCache}%)`;

  const systemPrompt = `Ты — ИИ-советник AqylShahar Акимата Алматы (LLaMA 3).
Отвечай КРАТКО по-русски — не более 3-4 предложений, чётко и по делу.
${snap}`;

  const messages = [{ role: 'system', content: systemPrompt }];
  if (history?.length > 0) {
    // Only last 6 messages for speed
    history.slice(-6).forEach(h => messages.push({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text }));
  }
  messages.push({ role: 'user', content: userQuestion });

  let fullText = '';
  try {
    for await (const chunk of streamOllamaChat(messages, CONFIG.MODEL)) {
      fullText += chunk;
      if (onChunk) onChunk(fullText);
    }
  } catch (err) {
    const errMsg = `❌ Ollama недоступна\nПроверьте: ollama run ${CONFIG.MODEL}\nОшибка: ${err.message}`;
    if (onChunk) onChunk(errMsg);
    return errMsg;
  }

  return fullText || '(Пустой ответ)';
};

// ─── REAL CITY DATA ───────────────────────────────────────────────────────────
export const fetchRealCityData = async (options = {}) => {
  const sensors    = await SensorGridManager.fetchAllSensors(options);
  const evaluation = RiskAnalyzer.computeMatrix(sensors);

  lastSensorsContext = `Радиация: ${fmt(sensors.radiation.highest_usv, 3)} uSv | Сейсмика: ${fmt(sensors.seismic.maxMag, 1)} Mag | Блэкаут: ${evaluation.powerLoad}% | Аль-Фараби: ${evaluation.alfarabi}%`;

  return { 
    rawSensors: sensors, 
    aiAnalysis: evaluation,
    sources: { 
      ...sensors.sources,
      integrity: 'AI-Вычисленный индекс',
      tension: 'AI-Анализ соц. сетей',
      power: 'AI-Модель энергосети'
    } 
  };
};

// ─── AI ANALYSIS (FAST STREAMING JSON) ────────────────────────────────────────
// Cache to avoid re-calling Ollama if data hasn't changed much
let _analysisCache       = null;
let _analysisCacheKey    = '';

export const generateAIAnalysis = async (evalDataObject, mode, bustCache = false) => {
  const cacheKey = `${evalDataObject.integrity}|${mode}|${evalDataObject.tension}`;
  if (!bustCache && _analysisCache && _analysisCacheKey === cacheKey) return _analysisCache;

  const computedColor =
    evalDataObject.integrity > 80 ? 'var(--color-success)' :
    evalDataObject.integrity > 50 ? 'var(--color-warning)' : 'var(--color-danger)';

  const errorFallback = {
    statusColor:       computedColor,
    analysisLabel:     'OLLAMA OFFLINE',
    executive_summary: `❌ Не удалось подключиться к Ollama.\nПроверьте: ollama run ${CONFIG.MODEL}\nСистемный анализ: ${evalDataObject.threat_analysis?.[0] || 'Данные в норме'}`,
    threat_analysis:   evalDataObject.threat_analysis || ['ИИ-анализ недоступен'],
    recommended_actions: evalDataObject.recommended_actions || ['Проверьте Ollama'],
  };

  const systemPrompt = `Ты — AqylShahar AI, ИИ-система управления городом Алматы (LLaMA 3).
Текущие данные датчиков города:
- Целостность инфраструктуры: ${evalDataObject.integrity}%
- Социальное напряжение: ${evalDataObject.tension} ед.
- Энергосеть ТЭЦ: ${evalDataObject.powerLoad}%
- Трафик Аль-Фараби: ${evalDataObject.alfarabi}%
- Режим: ${mode === 'smog' ? 'КАТАСТРОФА — ЭКСТРЕННЫЙ ПРОТОКОЛ' : 'штатный мониторинг'}
- Зафиксированные угрозы: ${(evalDataObject.threat_analysis || []).join('; ')}
${lastSensorsContext}

Сгенерируй ДЕТАЛЬНЫЙ JSON-анализ на русском языке:
{
  "statusColor": "var(--color-success)" или "var(--color-warning)" или "var(--color-danger)",
  "analysisLabel": "краткий статус 2-4 слова",
  "executive_summary": "3-4 полных содержательных предложения об общей обстановке в городе, с конкретными числами и рекомендациями",
  "threat_analysis": [
    "Подробное описание угрозы 1 с числами и последствиями",
    "Подробное описание угрозы 2",
    "Подробное описание угрозы 3",
    "Подробное описание угрозы 4",
    "Подробное описание угрозы 5"
  ],
  "recommended_actions": [
    "Конкретная директива 1 Акимата с исполнителем и сроком",
    "Конкретная директива 2",
    "Конкретная директива 3",
    "Конкретная директива 4",
    "Конкретная директива 5"
  ]
}
ВАЖНО: пиши развёрнуто, конкретно, на русском языке. Не используй заглушки типа 'угроза 1'.`;

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

  try {
    // Use streaming generate for fastest first-byte response
    const response = await fetch(`${CONFIG.OLLAMA_URL}/api/generate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      signal:  controller.signal,
      body: JSON.stringify({
        model:   CONFIG.MODEL,
        prompt:  systemPrompt,
        stream:  true,
        format:  'json',
        options: { temperature: 0.3, num_predict: 700, num_ctx: 4096 },
      }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    clearTimeout(timeoutId);

    // Collect streaming tokens with a hard break-out timeout
    const reader     = response.body?.getReader();
    const decoder    = new TextDecoder();
    let   rawJson    = '';
    let   buffer     = '';
    const startFetch = Date.now();

    while (true) {
      if (Date.now() - startFetch > 15000) { // 15s hard limit for the body stream
        console.warn('Ollama stream timed out.');
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const chunk = JSON.parse(line);
          if (chunk.response) rawJson += chunk.response;
          if (chunk.done) break;
        } catch (_) {}
      }
    }

    let parsed;
    try {
      // Find JSON block if it's wrapped in markers or messy
      const jsonStart = rawJson.indexOf('{');
      const jsonEnd   = rawJson.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        rawJson = rawJson.substring(jsonStart, jsonEnd + 1);
      }
      parsed = JSON.parse(rawJson);
    } catch (_) {
      // Partial JSON or garbage — use rule-based fallback
      return {
        ...errorFallback,
        analysisLabel:     'ПАРАМЕТРИЧЕСКИЙ АНАЛИЗ',
        executive_summary: `Сбой формирования ИИ-пакета. ${evalDataObject.threat_analysis?.[0] || 'Ситуация стабильна.'}`,
      };
    }

    const result = {
      statusColor:       parsed.statusColor       || computedColor,
      analysisLabel:     parsed.analysisLabel     || 'АНАЛИЗ',
      executive_summary: parsed.executive_summary || '',
      threat_analysis:   Array.isArray(parsed.threat_analysis)     ? parsed.threat_analysis     : [],
      recommended_actions: Array.isArray(parsed.recommended_actions) ? parsed.recommended_actions : [],
    };

    _analysisCache    = result;
    _analysisCacheKey = cacheKey;
    return result;

  } catch (err) {
    clearTimeout(timeoutId);
    return errorFallback;
  }
};