import React, { useMemo } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { fmt, fmtPct } from '../utils.js';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import '../components/Components.css';

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(6,6,18,0.97)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
  fontSize: 12,
};

const getTC = v => v > 80 ? '#ef4444' : v > 60 ? '#f59e0b' : '#10b981';

const TransportView = () => {
  const { metrics, mode } = useSimulation();

  const streets = [
    { name: 'Аль-Фараби',  load: metrics.transport.alfarabi,    speed: Math.round(60 - metrics.transport.alfarabi * 0.4), cameras: 48 },
    { name: 'Абая',        load: metrics.transport.abay,        speed: Math.round(65 - metrics.transport.abay * 0.4),    cameras: 36 },
    { name: 'Достык',      load: metrics.transport.dostyk,      speed: Math.round(70 - metrics.transport.dostyk * 0.4),  cameras: 22 },
    { name: 'Розыбакиева', load: metrics.transport.rozybakieva, speed: Math.round(65 - metrics.transport.rozybakieva * 0.4), cameras: 18 },
    { name: 'Саина',       load: Math.round(metrics.transport.alfarabi * 0.78), speed: 42, cameras: 12 },
    { name: 'Навои',       load: Math.round(metrics.transport.abay * 0.65),     speed: 48, cameras: 9 },
  ].sort((a, b) => b.load - a.load);

  // Hourly traffic for last 12h
  const hourlyTraffic = useMemo(() => {
    const h = new Date().getHours();
    return Array.from({ length: 12 }, (_, i) => {
      const hour = (h - 11 + i + 24) % 24;
      const peak = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);
      const base = metrics.transport.alfarabi;
      const val = Math.min(100, Math.round((peak ? base * 1.2 : base * 0.65) * (0.9 + Math.random() * 0.2)));
      return { time: `${String(hour).padStart(2,'0')}:00`, alfarabi: val, abay: Math.round(val * 0.87) };
    });
  }, [metrics.transport.alfarabi]);

  // Pie data for incident categories
  const incidentBreakdown = useMemo(() => {
    const cats = {};
    metrics.incidents.forEach(i => { cats[i.category] = (cats[i.category] || 0) + 1; });
    const colors = ['#ef4444','#f59e0b','#6366f1','#10b981','#06b6d4','#a855f7','#f97316','#ec4899'];
    return Object.entries(cats).map(([name, val], i) => ({ name, val, color: colors[i % colors.length] }));
  }, [metrics.incidents]);

  const trafficIndex = mode === 'smog' ? 9 : Math.round(metrics.transport.alfarabi / 12);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ─────────────────────────────────────── */}
      <div className="glass-panel animate-slide-up" style={{ padding: '22px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, fontSize: 26,
              background: 'linear-gradient(135deg, rgba(245,158,11,0.22), rgba(245,158,11,0.06))',
              border: '1px solid rgba(245,158,11,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>🚗</div>
            <div>
              <h2 className="brand-font" style={{ fontSize: 26, margin: 0 }}>ТРАНСПОРТНЫЕ ПОТОКИ <i>(SERGEK)</i></h2>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginTop: 4, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                Real-Time Traffic Intelligence · 145 камер · 6 магистралей
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{
              padding: '8px 16px', borderRadius: 10, fontSize: 22, fontWeight: 900,
              background: `rgba(${mode === 'smog' ? '239,68,68' : '245,158,11'},0.12)`,
              border: `1px solid rgba(${mode === 'smog' ? '239,68,68' : '245,158,11'},0.4)`,
              color: mode === 'smog' ? '#ef4444' : '#f59e0b',
            }}>{trafficIndex}<span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>/10</span></div>
            <div className={`status-badge ${mode === 'smog' ? 'danger' : streets[0].load > 70 ? 'warning' : 'success'}`}>
              <div className={`live-dot ${mode === 'smog' ? 'danger' : streets[0].load > 70 ? 'warning' : ''}`} />
              {mode === 'smog' ? 'КОЛЛАПС' : streets[0].load > 70 ? 'ВЫСОКАЯ НАГРУЗКА' : 'НОРМАЛЬНЫЙ ПОТОК'}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Strip ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        {[
          { label: 'Индекс пробок', val: `${trafficIndex}/10`, color: getTC(trafficIndex * 10), icon: '🚦' },
          { label: 'ДТП активных', val: metrics.transport.accidents, color: metrics.transport.accidents > 3 ? '#ef4444' : '#10b981', icon: '🚨' },
          { label: 'Аль-Фараби', val: fmtPct(metrics.transport.alfarabi), color: getTC(metrics.transport.alfarabi), icon: '📍' },
          { label: 'Пробок км', val: mode === 'smog' ? '47 км' : `${Math.round(metrics.transport.alfarabi * 0.35)} км`, color: '#f59e0b', icon: '📏' },
          { label: 'Объездов', val: mode === 'smog' ? 12 : 3, color: '#06b6d4', icon: '🔄' },
        ].map(({ label, val, color, icon }) => (
          <div key={label} className="glass-panel animate-slide-up spatial-card" style={{ textAlign: 'center', padding: '20px 14px' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 20px ${color}44` }}>{val}</div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Traffic trend line chart */}
        <div className="glass-panel animate-slide-up" style={{ padding: 24, animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              📈 Динамика нагрузки · 12 часов
            </div>
            <div className="source-badge">Источник: {metrics.sources?.traffic || 'Sergek IT'}</div>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyTraffic} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [`${v}%`, n]}/>
                <Line type="monotone" dataKey="alfarabi" name="Аль-Фараби" stroke="#f59e0b" strokeWidth={2.5} dot={false}/>
                <Line type="monotone" dataKey="abay" name="Абая" stroke="#6366f1" strokeWidth={2} dot={false} strokeDasharray="4 2"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            {[{ label: 'Аль-Фараби', color: '#f59e0b' }, { label: 'Абая', color: '#6366f1' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 16, height: 3, borderRadius: 2, background: l.color }} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Incidents by category */}
        <div className="glass-panel animate-slide-up" style={{ padding: 24, animationDelay: '0.15s' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12 }}>
            🚨 Инциденты по категориям ({metrics.incidents.length} всего)
          </div>
          {incidentBreakdown.length > 0 ? (
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={incidentBreakdown} cx="50%" cy="50%" outerRadius={75} dataKey="val" label={({ name, val }) => `${name}: ${val}`} labelLine={false} fontSize={9}>
                    {incidentBreakdown.map((e, i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Нет инцидентов
            </div>
          )}
        </div>
      </div>

      {/* ── Streets Detail ──────────────────────────────── */}
      <div className="glass-panel animate-slide-up" style={{ padding: 28, animationDelay: '0.2s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>
            📡 Детальный мониторинг магистралей
          </div>
          <div className="source-badge">Обновлено: {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {streets.map(street => {
            const c = getTC(street.load);
            const statusTxt = street.load > 80 ? 'ПРОБКИ' : street.load > 60 ? 'ЗАМЕДЛЕНИЕ' : 'СВОБОДНО';
            return (
              <div key={street.name} style={{
                padding: '16px 18px', borderRadius: 14,
                background: `${c}09`, border: `1px solid ${c}25`,
                transition: 'all 0.3s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 3 }}>{street.name}</div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: c, letterSpacing: '1px' }}>{statusTxt}</div>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: c, fontVariantNumeric: 'tabular-nums' }}>
                    {Math.round(street.load)}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>%</span>
                  </div>
                </div>

                <div className="progress-bg" style={{ marginBottom: 10 }}>
                  <div className="progress-fill" style={{
                    width: `${street.load}%`,
                    background: `linear-gradient(90deg, ${c}88, ${c})`,
                  }}/>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                  <span>⚡ {street.speed} км/ч</span>
                  <span>📷 {street.cameras} камер</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TransportView;
