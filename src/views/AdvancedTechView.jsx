import React, { useMemo } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { fmt, fmtPct, fmtInt } from '../utils.js';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import '../components/Components.css';

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(6,6,18,0.97)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
  fontSize: 12,
};

const AdvancedTechView = () => {
  const { metrics, mode } = useSimulation();
  
  const powerLoad = metrics.advanced?.powerLoad || 65;
  const radiation = metrics.advanced?.radiation || 0.12;
  const reservoir = metrics.advanced?.reservoirLevel || 85;
  const tension   = metrics.advanced?.socialTension || 120;

  // Power breakdown detail
  const powerBreakdown = [
    { name: 'Индустрия', val: Math.round(powerLoad * 0.45), color: '#a855f7' },
    { name: 'Жилой сектор', val: Math.round(powerLoad * 0.35), color: '#10b981' },
    { name: 'Транспорт/Электр.', val: Math.round(powerLoad * 0.15), color: '#06b6d4' },
    { name: 'Уличное осв.', val: Math.round(powerLoad * 0.05), color: '#f59e0b' },
  ];

  // Social Tension History (simulated trend)
  const tensionHistory = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const h = (new Date().getHours() - 11 + i + 24) % 24;
      return {
        time: `${String(h).padStart(2, '0')}:00`,
        tension: Math.round(tension * (0.8 + Math.random() * 0.4)),
        incidents: Math.floor(Math.random() * 5)
      };
    });
  }, [tension]);

  // Infrastructure Radar
  const infraRadar = [
    { subject: 'Энергосеть', A: powerLoad, full: 100 },
    { subject: 'Водосток', A: Math.min(100, reservoir), full: 100 },
    { subject: 'Связь/5G', A: 96, full: 100 },
    { subject: 'Транзит', A: metrics.advanced?.transitLoad || 70, full: 100 },
    { subject: 'Безопасность', A: 100 - (metrics.incidents.length * 2), full: 100 },
  ];

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header ─────────────────────────────────────── */}
      <div className="glass-panel animate-slide-up" style={{ padding: '24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, fontSize: 26,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.22), rgba(99,102,241,0.06))',
              border: '1px solid rgba(99,102,241,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(99,102,241,0.18)',
            }}>☢️</div>
            <div>
              <h2 className="brand-font" style={{ fontSize: 26, margin: 0 }}>ТЕХНОЛОГИЧЕСКИЙ МОНИТОРИНГ <i>(IA CORE)</i></h2>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginTop: 4, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                AI Core v2.4 · Спектральный анализ · Телеметрия ресурсов
              </div>
            </div>
          </div>
          <div className={`status-badge ${powerLoad > 85 || mode === 'smog' ? 'danger' : 'success'}`}>
            <div className={`live-dot ${powerLoad > 85 || mode === 'smog' ? 'danger' : ''}`} />
            {powerLoad > 85 || mode === 'smog' ? 'КРИТИЧЕСКИЙ РЕЖИМ' : 'СИСТЕМА СТАБИЛЬНА'}
          </div>
        </div>
      </div>

      {/* ── KPI Row ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Радиация', val: `${fmt(radiation, 3)} μSv/h`, color: radiation > 0.25 ? '#ef4444' : '#10b981', sub: 'Норма: 0.12-0.20', icon: '☢️' },
          { label: 'Социальное напряжение', val: fmtInt(tension), color: tension > 400 ? '#f59e0b' : '#10b981', sub: 'на базе AI-Sentiment', icon: '📡' },
          { label: 'Загрузка метро', val: fmtPct(metrics.advanced?.transitLoad || 62), color: '#6366f1', sub: 'пиковая нагрузка', icon: '🚇' },
          { label: 'Широкополосность', val: '99.2%', color: '#06b6d4', sub: 'уровень 5G покрытия', icon: '📶' },
        ].map(({ label, val, color, sub, icon }) => (
          <div key={label} className="glass-panel animate-slide-up spatial-card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color, textShadow: `0 0 20px ${color}44` }}>{val}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Analysis Charts Row 1 ───────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        
        {/* Social Tension Area Chart */}
        <div className="glass-panel animate-slide-up" style={{ padding: 24, animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              📈 Индекс социальной напряженности · 12 часов
            </div>
            <div className="source-badge">{metrics.sources?.tension || 'AI-SENTIMENT'}</div>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tensionHistory} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="tensionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="tension" name="Индекс напряжения" stroke="#f59e0b" strokeWidth={3} fill="url(#tensionGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Infrastructure Radar */}
        <div className="glass-panel animate-slide-up" style={{ padding: 24, animationDelay: '0.15s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              🕸️ Целостность инфраструктуры
            </div>
            <div className="source-badge">{metrics.sources?.integrity || 'AI-CORE'}</div>
          </div>
          <div style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={infraRadar}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <Radar name="Status" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Row 2: Power Breakdown + Reservoir ────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 20 }}>
        
        {/* Power Breakdown Bar Chart */}
        <div className="glass-panel animate-slide-up" style={{ padding: 24, animationDelay: '0.2s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              ⚡ Потребление электроэнергии (МВт)
            </div>
            <div className="source-badge">{metrics.sources?.power || 'KEGOC'}</div>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={powerBreakdown} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-main)', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.02)' }}/>
                <Bar dataKey="val" radius={[0, 4, 4, 0]}>
                  {powerBreakdown.map((e, i) => <Cell key={i} fill={e.color}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reservoir / Seismology Detailed card */}
        <div className="glass-panel animate-slide-up" style={{ padding: 26, animationDelay: '0.25s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              💧 Ресурсы и Водохранилища
            </div>
            <div className="source-badge">{metrics.sources?.hydro || 'KAZGIDROMET'}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                 <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>Уровень БАО</span>
                 <span style={{ fontSize: 13, fontWeight: 900, color: reservoir > 110 ? '#ef4444' : '#06b6d4' }}>{fmtInt(reservoir)}%</span>
              </div>
              <div className="progress-bg" style={{ height: 10 }}>
                <div className="progress-fill" style={{
                  width: `${Math.min(100, reservoir)}%`,
                  background: `linear-gradient(90deg, #06b6d488, ${reservoir > 110 ? '#ef4444' : '#06b6d4'})`,
                  boxShadow: reservoir > 110 ? '0 0 15px rgba(239,68,68,0.4)' : 'none'
                }}/>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
                Расход: 12.4 м³/с | Запас: Оптимально
              </div>
            </div>
            <div>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                 <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>Прогноз осадков</span>
                 <span style={{ fontSize: 13, fontWeight: 900, color: '#6366f1' }}>LOW</span>
              </div>
              <div className="progress-bg" style={{ height: 10 }}>
                <div className="progress-fill" style={{ width: '22%', background: '#6366f1' }}/>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
                Инверсия: Высокая | Риск селя: Низкий
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: 28, padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: 6 }}>🛰️ СТРАТЕГИЧЕСКИЕ ПРИОРИТЕТЫ AI</div>
            <div style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.5 }}>
              Анализ паттернов потребления рекомендует снижение мощности ТЭЦ-2 на 4% в ночное время для оптимизации ресурса фильтров.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedTechView;
