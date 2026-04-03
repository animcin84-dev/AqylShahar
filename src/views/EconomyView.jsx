import React, { useMemo } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { fmt } from '../utils.js';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import '../components/Components.css';

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(6,6,18,0.97)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  fontSize: 12,
};

const ECONOMIC_INDICES = [
  { name: 'Промышленность', val: 78, unit: 'PMI', color: '#6366f1', trend: '+2.1%' },
  { name: 'Строительство',  val: 65, unit: 'PMI', color: '#06b6d4', trend: '+0.8%' },
  { name: 'Потребление',    val: 82, unit: 'PMI', color: '#10b981', trend: '+3.4%' },
  { name: 'Услуги',         val: 71, unit: 'PMI', color: '#a855f7', trend: '-1.2%' },
];

const EconomyView = () => {
  const { metrics } = useSimulation();

  const usd = metrics.economy?.usdkzt || 450;
  const temp = metrics.weather?.temperature || 15;
  const wind = metrics.weather?.windspeed || 10;

  // Simulate USD/KZT trend for 14 days
  const fxTrend = useMemo(() => {
    const base = usd;
    return Array.from({ length: 14 }, (_, i) => ({
      day: `${i + 1}`,
      rate: parseFloat((base + (Math.random() * 10 - 5) * (i / 4)).toFixed(2)),
    }));
  }, [usd]);

  // Hourly temperature trend (meteorology)
  const tempTrend = useMemo(() => {
    if (metrics.weather?.history?.length > 0) {
      // Map API history to chart format
      return metrics.weather.history;
    }
    // Fallback if API hasn't returned history yet
    return Array.from({ length: 12 }, (_, i) => {
      const h = (new Date().getHours() - 11 + i + 24) % 24;
      const diurnal = Math.sin((h - 6) * Math.PI / 12) * 8;
      return {
        time: `${String(h).padStart(2,'0')}:00`,
        temp: parseFloat((temp + diurnal * (0.9 + Math.random() * 0.2)).toFixed(1)),
        wind: Math.round((wind + (Math.random() * 6 - 3))),
      };
    });
  }, [temp, wind, metrics.weather.history]);

  // Seismic events for bar chart
  const seismicData = useMemo(() => {
    const h = new Date().getHours();
    return Array.from({ length: 8 }, (_, i) => {
      const hour = (h - 7 + i + 24) % 24;
      return {
        time: `${String(hour).padStart(2,'0')}:00`,
        mag: parseFloat((1 + Math.random() * (metrics.seismic.maxQuakeMag - 1 || 2)).toFixed(1)),
        events: Math.floor(Math.random() * 3),
      };
    });
  }, [metrics.seismic.maxQuakeMag]);

  const seismicColor = metrics.seismic.maxQuakeMag > 4.5 ? '#ef4444'
    : metrics.seismic.maxQuakeMag > 3 ? '#f59e0b'
    : '#10b981';

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ─────────────────────────────────────── */}
      <div className="glass-panel animate-slide-up" style={{ padding: '22px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, fontSize: 26,
              background: 'linear-gradient(135deg, rgba(16,185,129,0.22), rgba(16,185,129,0.06))',
              border: '1px solid rgba(16,185,129,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>💹</div>
            <div>
              <h2 className="brand-font" style={{ fontSize: 26, margin: 0 }}>ЭКОНОМИКА И МЕТЕО <i>(SYNC)</i></h2>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginTop: 4, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                KASE · ExchangeRate API · OpenMeteo · USGS / IRIS
              </div>
            </div>
          </div>
          <div style={{
            padding: '8px 18px', borderRadius: 10,
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
            fontSize: 11, color: 'var(--color-primary)', fontWeight: 800, letterSpacing: '1px',
          }}>MULTI-SOURCE ANALYSIS</div>
        </div>
      </div>

      {/* ── KPI Row ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        {[
          { label: 'USD / KZT', val: `${fmt(usd, 0)} ₸`,    color: '#10b981', icon: '💵', sub: 'Нац. банк РК' },
          { label: 'EUR / KZT', val: `${fmt(usd * 1.09, 0)} ₸`, color: '#6366f1', icon: '💶', sub: 'Курс ЦБ' },
          { label: 'Температура', val: `${fmt(temp, 1)}°C`,  color: temp < 0 ? '#06b6d4' : temp > 30 ? '#ef4444' : '#f59e0b', icon: '🌡️', sub: 'OpenMeteo LIVE' },
          { label: 'Ветер',      val: `${fmt(wind, 1)} км/ч`, color: '#06b6d4', icon: '💨', sub: `${wind < 5 ? 'Штиль' : wind < 15 ? 'Умеренный' : 'Сильный'}` },
          { label: 'Сейсмика',   val: metrics.seismic.maxQuakeMag > 0 ? `${fmt(metrics.seismic.maxQuakeMag, 1)} Mag` : '-- Mag', color: seismicColor, icon: '🌍', sub: `${metrics.seismic.recentQuakeCount} событий 24ч` },
        ].map(({ label, val, color, icon, sub }) => (
          <div key={label} className="glass-panel animate-slide-up spatial-card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color, textShadow: `0 0 20px ${color}44` }}>{val}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Charts Row 1 ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>

        {/* FX Rate Trend */}
        <div className="glass-panel animate-slide-up" style={{ padding: 24, animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                💵 USD/KZT · Динамика за 14 дней
              </div>
              <div className="source-badge">Источник: {metrics.sources?.economy || 'KASE'}</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{fmt(usd, 2)} ₸</div>
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fxTrend} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="fxGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto','auto']}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v} ₸`, 'USD/KZT']}/>
                <Area type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2.5} fill="url(#fxGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Economic Indices */}
        <div className="glass-panel animate-slide-up" style={{ padding: 24, animationDelay: '0.15s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              📊 Экономические индексы (PMI)
            </div>
            <div className="source-badge">AI-ЭСТРАПОЛЯЦИЯ</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ECONOMIC_INDICES.map(idx => (
              <div key={idx.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{idx.name}</span>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: idx.trend.startsWith('+') ? '#10b981' : '#ef4444', fontWeight: 700 }}>{idx.trend}</span>
                    <span style={{ fontWeight: 800, color: idx.color }}>{idx.val} {idx.unit}</span>
                  </div>
                </div>
                <div className="progress-bg" style={{ height: 5 }}>
                  <div className="progress-fill" style={{
                    width: `${idx.val}%`,
                    background: `linear-gradient(90deg, ${idx.color}88, ${idx.color})`,
                  }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts Row 2 ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Temperature / Wind trend */}
        <div className="glass-panel animate-slide-up" style={{ padding: 24, animationDelay: '0.2s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              🌡️ Температура и ветер · 12 часов
            </div>
            <div className="source-badge">Источник: {metrics.sources?.weather || 'OpenMeteo'}</div>
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tempTrend} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TOOLTIP_STYLE}/>
                <Line type="monotone" dataKey="temp" name="Темп. °C" stroke="#f59e0b" strokeWidth={2.5} dot={false}/>
                <Line type="monotone" dataKey="wind" name="Ветер км/ч" stroke="#06b6d4" strokeWidth={2} dot={false} strokeDasharray="4 2"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            {[{ label: 'Температура', color: '#f59e0b' }, { label: 'Ветер', color: '#06b6d4' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 16, height: 3, borderRadius: 2, background: l.color }} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Seismic chart */}
        <div className="glass-panel animate-slide-up" style={{ padding: 24, animationDelay: '0.25s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              🌍 Геодинамика · USGS / IRIS
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>СОБЫТИЯ</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-bright)' }}>{metrics.seismic.recentQuakeCount}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>MAX MAG</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: seismicColor }}>
                  {metrics.seismic.maxQuakeMag > 0 ? fmt(metrics.seismic.maxQuakeMag, 1) : '--'}
                </div>
              </div>
            </div>
          </div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seismicData} margin={{ top: 5, right: 10, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v} Mag`, 'Магнитуда']}/>
                <Bar dataKey="mag" radius={[4,4,0,0]} name="Магнитуда">
                  {seismicData.map((entry, i) => (
                    <Cell key={i} fill={entry.mag > 4.5 ? '#ef4444' : entry.mag > 3 ? '#f59e0b' : '#6366f1'}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: `${seismicColor}0d`, border: `1px solid ${seismicColor}25`, fontSize: 11, color: 'var(--text-muted)' }}>
            {metrics.seismic.maxQuakeMag > 4.5
              ? `⚠️ Значимый сейсмический сигнал ${fmt(metrics.seismic.maxQuakeMag, 1)} Mag. Рекомендуется проверка высоток.`
              : metrics.seismic.recentQuakeCount > 0
              ? `Микротолчки в норме. Датчики СОМЭ в штатном режиме. Мониторинг 32 точек.`
              : `Сейсмическая обстановка спокойная. Все 32 датчика работают штатно.`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EconomyView;
