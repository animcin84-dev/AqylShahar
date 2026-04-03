import React, { useMemo } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { fmt, fmtPct } from '../utils.js';
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import '../components/Components.css';

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(6,6,18,0.97)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  fontSize: 12,
};

const JKH_SYSTEMS = [
  { name: 'Водоснабжение',  icon: '💧', key: 'water',    completion: 98, outages: 1, pressure: '4.2 атм', color: '#06b6d4' },
  { name: 'Теплоснабжение', icon: '🔥', key: 'heat',     completion: 94, outages: 2, pressure: '8.1 бар', color: '#f97316' },
  { name: 'Электросеть',    icon: '⚡', key: 'electric', completion: 97, outages: 1, pressure: '220 В',    color: '#f59e0b' },
  { name: 'Канализация',    icon: '🌊', key: 'sewage',   completion: 99, outages: 0, pressure: '1.8 атм', color: '#10b981' },
  { name: 'Газоснабжение',  icon: '🔵', key: 'gas',      completion: 100, outages: 0, pressure: '0.3 МПа',color: '#6366f1' },
  { name: 'Связь/ВОЛС',     icon: '📡', key: 'fiber',    completion: 96, outages: 1, pressure: 'OK',      color: '#a855f7' },
];

const OUTAGE_LOG = [
  { time: '11:45', severity: 'critical', text: 'Сбой подстанции №4 — Аль-Фараби / Желтоксан', brigade: 'Бригада ПТЭ №7', status: 'В РАБОТЕ' },
  { time: '09:20', severity: 'warning',  text: 'Прорыв магистрали — ул. Макатаева / Пушкина',  brigade: 'АЖК Алмалы',    status: 'В РАБОТЕ' },
  { time: '07:55', severity: 'warning',  text: 'Засор ливневой канализации — мкр Самал-2',      brigade: 'КСК Самал',     status: 'УСТРАНЕНО' },
  { time: '06:30', severity: 'success',  text: 'Плановая замена труб Д219 — Розыбакиева 44',   brigade: 'Городской водоканал', status: 'ВЫПОЛНЕНО' },
  { time: '04:10', severity: 'info',     text: 'Техобслуживание ТП-82 — пр. Сейфуллина',       brigade: 'АЛСЭ Электро',  status: 'ВЫПОЛНЕНО' },
];

const JkhView = () => {
  const { metrics, mode } = useSimulation();

  const activeOutages = mode === 'smog' ? 6 : metrics.jkh.activeOutages;
  const completion    = metrics.jkh.completion;

  // Weekly repair KPI bar chart
  const weeklyKPI = useMemo(() => {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const today = new Date().getDay();
    return days.map((day, i) => ({
      day,
      выполнено: 8 + Math.floor(Math.random() * 12),
      план:      15,
      isToday: (i + 1) % 7 === today,
    }));
  }, []);

  // Power load hourly
  const powerTrend = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const h = (new Date().getHours() - 9 + i + 24) % 24;
      const base = metrics.advanced?.powerLoad || 65;
      const peak = (h >= 8 && h <= 11) || (h >= 18 && h <= 22);
      return {
        time: `${String(h).padStart(2,'0')}:00`,
        load: Math.round((peak ? base * 1.15 : base * 0.78) * (0.92 + Math.random() * 0.16)),
      };
    });
  }, [metrics.advanced?.powerLoad]);

  const sevColor = { critical: '#ef4444', warning: '#f59e0b', success: '#10b981', info: '#6366f1' };

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
            }}>🏠</div>
            <div>
              <h2 className="brand-font" style={{ fontSize: 26, margin: 0 }}>ЖКХ И ИНФРАСТРУКТУРА <i>(OPS)</i></h2>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginTop: 4, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                АЖК · Городской водоканал · АЛСЭ · Теплокоммунэнерго
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className={`status-badge ${activeOutages > 3 ? 'danger' : 'success'}`}>
              <div className={`live-dot ${activeOutages > 3 ? 'danger' : ''}`} />
              {activeOutages > 3 ? 'КРИТИЧЕСКАЯ НАГРУЗКА' : 'BRIGADES: ACTIVE-OPS'}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Strip ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'КПД бригад', val: `${completion}%`, color: completion > 90 ? '#10b981' : '#f59e0b', sub: 'за 24 часа', icon: '🎯' },
          { label: 'Активных аварий', val: activeOutages, color: activeOutages > 3 ? '#ef4444' : '#10b981', sub: 'в работе сейчас', icon: '🔧' },
          { label: 'Бригад в поле', val: mode === 'smog' ? 18 : 7, color: '#6366f1', sub: 'ПТЭ АЖК актив', icon: '👷' },
          { label: 'Граждан затронуто', val: mode === 'smog' ? '12,400' : '840', color: activeOutages > 3 ? '#f59e0b' : '#10b981', sub: 'абонентов', icon: '🏘️' },
        ].map(({ label, val, color, sub, icon }) => (
          <div key={label} className="glass-panel animate-slide-up spatial-card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color, textShadow: `0 0 20px ${color}44` }}>{val}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Systems Grid ────────────────────────────────── */}
      <div className="glass-panel animate-slide-up" style={{ padding: 24, animationDelay: '0.1s' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 18 }}>
          🔌 Состояние систем жизнеобеспечения
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {JKH_SYSTEMS.map(sys => (
            <div key={sys.key} style={{
              padding: '16px 18px', borderRadius: 14,
              background: `${sys.color}09`, border: `1px solid ${sys.color}25`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{sys.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)' }}>{sys.name}</span>
                </div>
                <div style={{
                  padding: '2px 8px', borderRadius: 6,
                  background: sys.outages > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)',
                  border: `1px solid ${sys.outages > 0 ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`,
                  fontSize: 9, fontWeight: 800,
                  color: sys.outages > 0 ? '#f59e0b' : '#10b981',
                }}>
                  {sys.outages > 0 ? `${sys.outages} авар.` : 'НОРМА'}
                </div>
              </div>
              <div className="progress-bg" style={{ marginBottom: 8 }}>
                <div className="progress-fill" style={{
                  width: `${sys.completion}%`,
                  background: `linear-gradient(90deg, ${sys.color}88, ${sys.color})`,
                }}/>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                <span>КПД: <strong style={{ color: sys.color }}>{sys.completion}%</strong></span>
                <span>Давление: <strong style={{ color: 'var(--text-main)' }}>{sys.pressure}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts Row ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Weekly repair KPI */}
        <div className="glass-panel animate-slide-up" style={{ padding: 24, animationDelay: '0.15s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              📊 Заявки и выполнение по дням недели
            </div>
            <div className="source-badge">Источник: AKIMAT 109</div>
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyKPI} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TOOLTIP_STYLE}/>
                <Bar dataKey="выполнено" fill="#10b981" radius={[4,4,0,0]}/>
                <Bar dataKey="план" fill="rgba(255,255,255,0.07)" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Power load trend */}
        <div className="glass-panel animate-slide-up" style={{ padding: 24, animationDelay: '0.2s' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16 }}>
            ⚡ Нагрузка энергосети · {Math.round(metrics.advanced?.powerLoad || 65)}%
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={powerTrend} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v}%`, 'Нагрузка']}/>
                <Area type="monotone" dataKey="load" stroke="#f59e0b" strokeWidth={2.5} fill="url(#powerGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Operations Log ──────────────────────────────── */}
      <div className="glass-panel animate-slide-up" style={{ padding: 28, animationDelay: '0.25s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>
            📋 Журнал оперативных воздействий
          </div>
          <div className="source-badge">Источник: ДЧС / 112 / АЖК</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(mode === 'smog' ? [
            { time: '11:45', severity: 'critical', text: 'КАТАСТРОФА: Сбой подстанции №4 — Аль-Фараби / Желтоксан', brigade: 'Бригада ПТЭ №7', status: 'КРИТИЧНО' },
            { time: '11:32', severity: 'critical', text: 'Прорыв магистральной трубы — мкр Самал-1 / Достык', brigade: 'Аварийная служба', status: 'В РАБОТЕ' },
            { time: '11:20', severity: 'warning',  text: 'Перегрузка ТП-14 — р-н Бостандык, Сатпаева 22', brigade: 'АЛСЭ Электро', status: 'В РАБОТЕ' },
            ...OUTAGE_LOG.slice(2),
          ] : OUTAGE_LOG).map((log, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '14px 18px', borderRadius: 12,
              background: `${sevColor[log.severity]}08`,
              border: `1px solid ${sevColor[log.severity]}25`,
              borderLeft: `4px solid ${sevColor[log.severity]}`,
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', fontFamily: 'monospace', marginTop: 1 }}>{log.time}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 4 }}>{log.text}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>👷 {log.brigade}</div>
              </div>
              <div style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 9, fontWeight: 800, whiteSpace: 'nowrap',
                background: `${sevColor[log.severity]}18`,
                color: sevColor[log.severity],
              }}>{log.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JkhView;
