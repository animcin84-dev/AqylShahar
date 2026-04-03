[38;2;216;222;233mexport const generatePdfText = (metrics, dataScope, time) => {}[0m
[38;2;216;222;233m  const modeText = dataScope === 'fake' ? 'Режим: СИМУЛЯЦИЯ' : 'Режим: LIVE ДАННЫЕ (Реальное время)';[0m
[38;2;216;222;233m  return `ОПЕРАТИВНАЯ СВОДКА АКИМАТА АЛМАТЫ`[0m
[38;2;216;222;233m${modeText}[0m
[38;2;216;222;233mДата и время: ${time.toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })} })}[0m

[38;2;216;222;233m--- ЭКОЛОГИЯ И КАЧЕСТВО ВОЗДУХА ---[0m
[38;2;216;222;233mАлмалинский ПР: ${metrics.ecology.almalyAQI} AQI (${metrics.ecology.overallStatus})[0m
[38;2;216;222;233mКонцентрация PM2.5: ${metrics.ecology.pm2_5.toFixed(1)} мкг/м³[0m
[38;2;216;222;233mКонцентрация PM10: ${metrics.ecology.pm10.toFixed(1)} мкг/м³[0m

[38;2;216;222;233m--- ТРАНСПОРТ И ИНФРАСТРУКТУРА ---[0m
[38;2;216;222;233mЗагрузка Пр. Аль-Фараби: ${metrics.transport.alfarabi.toFixed(1)}%[0m
[38;2;216;222;233mЗагрузка Ул. Абая: ${metrics.transport.abay.toFixed(1)}%[0m
[38;2;216;222;233mАктивные ДТП: ${metrics.transport.accidents} шт.[0m

[38;2;216;222;233m--- СЕЙСМОЛОГИЯ И ПОГОДА ---[0m
[38;2;216;222;233mТемпература воздуха: ${metrics.weather.temperature.toFixed(1)}°C[0m
[38;2;216;222;233mСкорость ветра: ${metrics.weather.windspeed.toFixed(1)} км/ч[0m
[38;2;216;222;233mСейсмическая активность (24ч): Макс. магнитуда ${metrics.seismic.maxQuakeMag.toFixed(1)} (${metrics.seismic.recentQuakeCount} толчков)[0m

[38;2;216;222;233m--- ЖКХ И ЭНЕРГЕТИКА ---[0m
[38;2;216;222;233mНагрузка энергосетей (ТЭЦ-2/ТЭЦ-3): ${metrics.advanced.powerLoad.toFixed(1)}%[0m
[38;2;216;222;233mОткрытые ордера по авариям ЖКХ: ${metrics.jkh.activeOutages}[0m
[38;2;216;222;233mУровень завершенности ремонта: ${metrics.jkh.completion}%[0m

[38;2;216;222;233m--- ИНЦИДЕНТЫ (ПОСЛЕДНИЕ) ---[0m
[38;2;216;222;233m${metrics.incidents.slice(0, 5).map(i => `- [${i.time}] ${i.category}: ${i.title} (${i.area})`).join('\n')}[0m

[38;2;216;222;233mОтчет сгенерирован системой AqylShahar AI.`;[0m
[38;2;216;222;233m};[0m
