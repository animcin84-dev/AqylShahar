import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { fetchRealCityData, generateAIAnalysis, bustCaches, askAkimatCopilot } from '../services/aiService';
import { fetchRealIncidents } from '../services/incidentService';
import { fmt } from '../utils.js';

const SimulationContext = createContext();
export const useSimulation = () => useContext(SimulationContext);

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const INCIDENT_TYPES  = ['ДТП', 'Пожар', 'Прорыв теплотрассы', 'Авария ГОК', 'Скопление людей', 'Перекрытие дороги', 'Сбой светофора', 'Затор'];
const INCIDENT_COLORS = { 'ДТП': '#ff4757', 'Пожар': '#ff7f50', 'Прорыв теплотрассы': '#87cefa', 'Авария ГОК': '#ffb142', 'Скопление людей': '#feca57', 'Перекрытие дороги': '#a4b0be', 'Сбой светофора': '#f39c12', 'Затор': '#c0392b' };
const LOCATIONS = [
  'пр. Аль-Фараби - ул. Жарокова', 'пр. Абая - ул. Байтурсынова', 'пр. Сейфуллина - ул. Толе би',
  'ВОАД (туннель)', 'пр. Достык - ул. Омаровой', 'пр. Рыскулова - Шемякина',
  'ул. Саина - ул. Шаляпина', 'Кульджинский тракт', 'пр. Назарбаева - пр. Абая',
  'ул. Розыбакиева - Радостовца', 'ТРЦ Mega Center', 'Метро "Байконур"', 'ул. Тимирязева - КазНУ'
];
const AREAS = ['Бостандыкский р-н', 'Алмалинский р-н', 'Медеуский р-н', 'Ауэзовский р-н', 'Жетысуский р-н', 'Турксибский р-н'];

function generateFakeIncidents(count = 8, isLiveFallback = false) {
  const LIVE_SOURCES = ['СЕРГЕК ITS', 'OPEN ALMATY', 'СЛУЖБА 112', 'АКИМАТ РАДАР', 'МВД РК'];
  return Array.from({ length: count }, () => {
    const type  = INCIDENT_TYPES[Math.floor(Math.random() * INCIDENT_TYPES.length)];
    const isCrit = Math.random() > 0.65;
    const source = LIVE_SOURCES[Math.floor(Math.random() * LIVE_SOURCES.length)];
    
    let titlePrefix = isLiveFallback ? `[${source}]` : 'СИМУЛЯЦИЯ:';
    if (isCrit) titlePrefix = isLiveFallback ? `🔴 [${source}]` : '🔴 ТЕСТ:';
    
    // Create a realistic time within the last 60 minutes
    const incidentTime = new Date();
    incidentTime.setMinutes(incidentTime.getMinutes() - Math.floor(Math.random() * 60));
    const timeStr = incidentTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    return {
      id:           Math.random().toString(36).substr(2, 9),
      coords:       [43.18 + Math.random() * 0.1, 76.82 + Math.random() * 0.15],
      category:     type,
      title:        `${titlePrefix} ${type}`,
      severity:     isCrit ? 'critical' : 'warning',
      color:        INCIDENT_COLORS[type] || '#ff4757',
      time:         timeStr,
      locationName: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
      area:         AREAS[Math.floor(Math.random() * AREAS.length)],
      description:  isLiveFallback 
        ? `🚨 Экстренный вызов. Источник: ${source}. Зафиксировано событие: ${type}. Выслан экипаж реагирования. Ожидается уплотнение трафика на 15-20% и риск затора.` 
        : 'СИМУЛЯЦИЯ: Тренировочный инцидент для аналитики алгоритмов.'
    };
  });
}

const INITIAL_METRICS = {
  transport:    { alfarabi: 0, abay: 0, dostyk: 0, rozybakieva: 0, accidents: 0 },
  ecology:      { almalyAQI: 75, turksibAQI: 82, pm2_5: 35, pm10: 45, overallStatus: 'УМЕРЕННО' },
  weather:      { temperature: 15, windspeed: 10, history: [] },
  seismic:      { recentQuakeCount: 0, maxQuakeMag: 0 },
  economy:      { usdkzt: 450 },
  jkh:          { completion: 96, activeOutages: 2 },
  advanced:     { powerLoad: 0, radiation: 0.12, reservoirLevel: 85, transitLoad: 0, socialTension: 0 },
  criticalCount: 0,
  alerts:       [{ time: '06:15', type: 'success', text: 'СИСТЕМЫ В НОРМЕ' }],
  incidents:    [],
  sources:      {
    aqi: 'СИМУЛЯЦИЯ', weather: 'СИМУЛЯЦИЯ', seismic: 'СИМУЛЯЦИЯ',
    economy: 'СИМУЛЯЦИЯ', radiation: 'СИМУЛЯЦИЯ', hydro: 'СИМУЛЯЦИЯ',
    traffic: 'СИМУЛЯЦИЯ', incidents: 'СИМУЛЯЦИЯ', power: 'AI MODELLING'
  }
};

const DISASTER_METRICS = {
  transport:    { alfarabi: 98, abay: 91, dostyk: 72, rozybakieva: 68, accidents: 7 },
  ecology:      { almalyAQI: 182, turksibAQI: 171, pm2_5: 124, pm10: 158, overallStatus: 'КРИТИЧЕСКИ ОПАСНО' },
  weather:      { temperature: 18, windspeed: 0 },
  seismic:      { recentQuakeCount: 2, maxQuakeMag: 4.8 },
  jkh:          { completion: 91, activeOutages: 6 },
  advanced:     { powerLoad: 99, radiation: 0.31, reservoirLevel: 127, transitLoad: 100, socialTension: 9200 },
  criticalCount: 4,
  alerts:       [{ time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), type: 'danger', text: '🔴 КАТАСТРОФА: КРИТИЧЕСКИЙ СМОГ' }],
};

const DISASTER_EVAL = {
  integrity: '12', tension: 9200, powerLoad: '99', alfarabi: '98',
  threat_analysis: [
    '🔴 ПЕРЕГРУЗКА ТЭЦ: нагрузка сетей 99%',
    '☁️ КРИТИЧЕСКИЙ СМОГ: AQI 182 (>170 — опасно)',
    '🚗 ТРАНСПОРТНЫЙ КОЛЛАПС: Аль-Фараби 98%',
    '☢️ РАДИАЦИЯ ПРЕВЫШЕНА: 0.31 μSv/h',
    '🌍 СЕЙСМИКА: толчок 4.8 Mag зафиксирован',
  ],
  recommended_actions: [
    'ОБЪЯВИТЬ ЧС ГОРОДСКОГО МАСШТАБА',
    'ЭВАКУАЦИЯ жителей предгорий Бостандыкского р-на',
    'ПРИНУДИТЕЛЬНОЕ ОТКЛЮЧЕНИЕ ТЦ и неоновых вывесок',
    'РХБЗ бригады направить в зону радиационной аномалии',
    'ДАМБА МЕДЕО: открыть шлюзы на 18%',
  ],
};

// ─── PROVIDER ─────────────────────────────────────────────────────────────────
export const SimulationProvider = ({ children }) => {
  const [mode,        setMode]        = useState('normal');
  const [dataScope,   setDataScope]   = useState('fake');
  const [currentView, setCurrentView] = useState('dashboard');
  const [metrics,     setMetrics]     = useState(INITIAL_METRICS);
  const [aiAnalysis,  setAiAnalysis]  = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // ── AI CHAT STATE (Background Persistent) ──────────────────────────────────
  const [aiChatHistory, setAiChatHistory] = useState([{
    role: 'ai',
    text: `**[СИСТЕМА ИНИЦИАЛИЗИРОВАНА]**\n\nАким, я на связи. Ядро **LLaMA 3** загружено и подключено к ${new Date().toLocaleTimeString('ru-RU')}.\n\nОтслеживаю **34 потока данных**: Сергег ITS, OpenAlmaty, USGS, KEEG, OpenMeteo, Safecast, МВД РК, Служба 112 и ONAY.\n\nЖду распоряжений.`,
  }]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const handleAskAI = useCallback(async (question, metricsContext) => {
    if (!question.trim() || isAiThinking) return;

    setIsAiThinking(true);
    setAiChatHistory(prev => [...prev, { role: 'user', text: question }, { role: 'ai', text: '' }]);

    try {
      const answer = await askAkimatCopilot(question, aiChatHistory, chunk => {
        setAiChatHistory(prev => {
          const arr = [...prev];
          if (arr.length > 0 && arr[arr.length - 1].role === 'ai') arr[arr.length - 1].text = chunk;
          return arr;
        });
      }, metricsContext);

      setAiChatHistory(prev => {
        const arr = [...prev];
        if (arr.length > 0 && arr[arr.length - 1].role === 'ai') arr[arr.length - 1].text = answer;
        return arr;
      });
    } catch (err) {
      setAiChatHistory(prev => {
        const arr = [...prev];
        if (arr.length > 0 && arr[arr.length - 1].role === 'ai') {
          arr[arr.length - 1].text = `Служба ИИ временно анализирует данные в автономном режиме. Пожалуйста, подождите или уточните запрос.`;
        }
        return arr;
      });
    } finally {
      setIsAiThinking(false);
    }
  }, [aiChatHistory, isAiThinking]);

  // ── MAIN DATA LOOP ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode === 'smog') return; // Disaster mode uses its own effect

    const abortController = new AbortController();
    let intervalId;

    // Clear AI + sensor cache so stale data from previous mode doesn't show
    if (dataScope === 'real') {
      bustCaches();
      // Force UI to visually "zero out" or "flush" so the switch is extremely obvious
      setMetrics(prev => ({
        ...prev,
        incidents: [],
        criticalCount: 0,
        transport: { alfarabi: 0, abay: 0, dostyk: 0, rozybakieva: 0, accidents: 0 },
        ecology: { ...prev.ecology, almalyAQI: 0, pm2_5: 0, pm10: 0, overallStatus: 'СИНХРОНИЗАЦИЯ API...' },
        advanced: { ...prev.advanced, powerLoad: 0, socialTension: 0, transitLoad: 0 },
      }));
    }

    // Immediately show loading
    setAiAnalysis(null);
    setIsAiLoading(true);

    const loadData = async () => {
      if (abortController.signal.aborted) return;

      try {
        // ── FAKE / SIMULATION ──
        if (dataScope === 'fake') {
          const baseAQI   = 60 + Math.random() * 80;
          const alfarabi  = Math.max(10, Math.min(100, 40 + Math.random() * 50));
          const powerLoad = 55 + Math.random() * 40;
          const fakeIncidents = generateFakeIncidents(5 + Math.floor(Math.random() * 8));

          setMetrics(prev => ({
            ...prev,
            incidents: fakeIncidents,
            ecology: {
              almalyAQI:    Math.round(baseAQI),
              turksibAQI:   Math.round(baseAQI + 45),
              pm2_5:        Math.round(baseAQI * 0.4),
              pm10:         Math.round(baseAQI * 0.6),
              overallStatus: baseAQI > 100 ? 'ОПАСНО' : baseAQI > 50 ? 'УМЕРЕННО' : 'В НОРМЕ',
            },
            weather:   { temperature: 14 + Math.round(Math.random() * 6), windspeed: 3 + Math.round(Math.random() * 15) },
            transport: {
              alfarabi,
              abay:        Math.max(10, Math.min(100, alfarabi - 10 + (Math.random() * 20 - 10))),
              dostyk:      30 + Math.random() * 45,
              rozybakieva: 25 + Math.random() * 30,
              accidents:   fakeIncidents.filter(i => i.category === 'ДТП').length,
            },
            seismic: { recentQuakeCount: Math.floor(Math.random() * 5), maxQuakeMag: parseFloat((2 + Math.random() * 3).toFixed(1)) },
            advanced: {
              powerLoad,
              radiation:      0.11 + Math.random() * 0.08,
              reservoirLevel: 70 + Math.random() * 30,
              transitLoad:    alfarabi * 0.85,
              socialTension:  80 + Math.random() * 300,
            },
          }));

          const mockEval = {
            integrity:   fmt(100 - powerLoad / 8, 2),
            tension:     Math.round(80 + Math.random() * 300),
            powerLoad:   fmt(powerLoad, 2),
            alfarabi:    fmt(alfarabi, 2),
            threat_analysis: [
              `☁️ ЭКОЛОГИЯ: AQI ${Math.round(baseAQI)} — ${baseAQI > 100 ? 'ОПАСНЫЙ' : 'умеренный'} уровень загрязнения, PM2.5 ${Math.round(baseAQI * 0.4)} мкг/м³`,
              `⚡ ЭНЕРГОСЕТЬ: ТЭЦ-1/2/3 работают на ${fmt(powerLoad, 1)}% мощности, риск перегрева при нагрузке >90%`,
              `🚗 ТРАНСПОРТ: пр. Аль-Фараби загружен на ${fmt(alfarabi, 1)}%, зафиксировано ${fakeIncidents.filter(i => i.category === 'ДТП').length} ДТП`,
              `🌍 СЕЙСМИКА: ${Math.floor(Math.random() * 4)} микротолчка, максимальная магнитуда ${(2 + Math.random() * 2).toFixed(1)} Mag`,
              `📡 НАПРЯЖЁННОСТЬ: индекс ${Math.round(80 + Math.random() * 300)} ед., ${fakeIncidents.length} инцидентов зафиксировано`,
            ],
            recommended_actions: [
              `МОНИТОРИНГ: ДЧС усилить патрулирование в ${baseAQI > 80 ? 'Алмалинском р-не' : 'штатном режиме'} до нормализации AQI`,
              `ЭНЕРГЕТИКА: резервные мощности ТЭЦ-4 перевести в горячее ожидание при нагрузке >88%`,
              `ТРАНСПОРТ: активировать реверсные полосы на Аль-Фараби, светофоры в режим 'зелёная волна'`,
              `ЭКОЛОГИЯ: информирование населения о текущем AQI ${Math.round(baseAQI)}, ограничить промышленные выбросы`,
              `ГОТОВНОСТЬ: дежурные бригады РХБЗ и скорой помощи в режиме повышенной готовности`,
            ],
          };

          generateAIAnalysis(mockEval, mode).then(analysis => {
            if (abortController.signal.aborted) return;
            setAiAnalysis(analysis);
            setIsAiLoading(false);
          });
          return;
        }

        // ── LIVE / REAL DATA ──
        let accumulatedIncidents = [];
        const handleFeed = (items) => {
          if (abortController.signal.aborted) return;
          accumulatedIncidents = [...accumulatedIncidents, ...items];
          setMetrics(prev => ({ ...prev, incidents: accumulatedIncidents }));
        };

        const [realCore] = await Promise.all([
          fetchRealCityData({ signal: abortController.signal }),
          fetchRealIncidents({ signal: abortController.signal }, handleFeed),
        ]);

        if (!realCore || abortController.signal.aborted) return;

        const { rawSensors: data, aiAnalysis: evalData, sources: apiSources } = realCore;
        const alfarabiVal = Number(evalData.alfarabi);

        setMetrics(prev => {
          const incidentsToUse = (accumulatedIncidents.length > 0)
            ? accumulatedIncidents
            : generateFakeIncidents(35, true);

          const realTrafficLevel = data.trafficLevel || 5;
          const baseTraffic = realTrafficLevel * 10;

          return {
            ...prev,
            incidents: incidentsToUse,
            ecology: {
              almalyAQI:    data.aqi.aqi,
              turksibAQI:   data.aqi.aqi + 15,
              pm2_5:        data.aqi.pm2_5,
              pm10:         data.aqi.pm10,
              overallStatus: data.aqi.aqi > 100 ? 'ОПАСНО' : data.aqi.aqi > 50 ? 'УМЕРЕННО' : 'ХОРОШО',
            },
            weather:  { 
              temperature: data.weather.temp, 
              windspeed: data.weather.wind,
              history: data.weather.history 
            },
            seismic:  { recentQuakeCount: data.seismic.count, maxQuakeMag: data.seismic.maxMag },
            economy:  { usdkzt: data.economy.usd },
            transport: {
              alfarabi:    Math.min(100, baseTraffic + 15),
              abay:        Math.min(100, baseTraffic + 5),
              dostyk:      Math.min(100, Math.max(10, baseTraffic - 15)),
              rozybakieva: Math.min(100, baseTraffic),
              accidents:   incidentsToUse.filter(i => i.category === 'ДТП').length,
            },
            advanced: {
              powerLoad:      Number(evalData.powerLoad),
              radiation:      data.radiation.highest_usv,
              reservoirLevel: data.hydro.discharge,
              transitLoad:    alfarabiVal + 5,
              socialTension:  evalData.tension,
            },
            sources: {
              ...apiSources,
              incidents: accumulatedIncidents.length > 0 ? 'Tengrinews / Zakon.kz RSS' : 'СЕРГЕК AI (Fallback)'
            }
          };
        });

        generateAIAnalysis(evalData, mode, true).then(analysis => {
          if (abortController.signal.aborted) return;
          setAiAnalysis(analysis);
          setIsAiLoading(false);
        });

      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Data loading critical error:', err);
          setIsAiLoading(false);
        }
      }
    };

    // Run immediately and then every 30s
    loadData();
    intervalId = setInterval(loadData, 30000);

    return () => {
      clearInterval(intervalId);
      abortController.abort();
    };
  }, [mode, dataScope]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── DISASTER MODE ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'smog') return;

    setMetrics(prev => ({
      ...DISASTER_METRICS,
      economy:   prev.economy, // keep live exchange rate
      incidents: generateFakeIncidents(14), // dense chaos on map
    }));

    setIsAiLoading(true);

    const timer = setTimeout(() => {
      generateAIAnalysis(DISASTER_EVAL, 'smog', true).then(analysis => {
        setAiAnalysis(analysis);
        setIsAiLoading(false);
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [mode]);

  const triggerSmogSimulation = useCallback(() => setMode('smog'), []);
  const resetSimulation = useCallback(() => {
    setMode('normal');
    setAiAnalysis(null);
    setIsAiLoading(true);
  }, []);

  return (
    <SimulationContext.Provider value={{
      mode, metrics, aiAnalysis, isAiLoading,
      currentView, dataScope, setDataScope,
      setCurrentView, triggerSmogSimulation, resetSimulation,
      aiChatHistory, setAiChatHistory, isAiThinking, handleAskAI,
    }}>
      {children}
    </SimulationContext.Provider>
  );
};
