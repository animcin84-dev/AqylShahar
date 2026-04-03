import React, { useState, useMemo } from 'react';
import { useSimulation } from '../context/SimulationContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';
import '../components/Components.css';

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(6,6,18,0.97)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
  fontSize: 12,
};

const IncidentsView = () => {
  const { metrics, mode } = useSimulation();
  const [expandedId, setExpandedId] = useState(null);

  // Take only the top 8 recent incidents
  const recentIncidents = useMemo(() => metrics.incidents.slice(0, 8), [metrics.incidents]);

  // Hourly incident volume (simulated last 12h)
  const hourlyVolume = useMemo(() => {
    const h = new Date().getHours();
    return Array.from({ length: 12 }, (_, i) => {
      const hour = (h - 11 + i + 24) % 24;
      return {
        time: `${String(hour).padStart(2, '0')}:00`,
        incidents: Math.floor(Math.random() * 6) + (hour >= 8 && hour <= 10 ? 3 : 0),
      };
    });
  }, []);

  // District distribution
  const districtData = useMemo(() => {
    const distMap = {};
    metrics.incidents.forEach(inc => {
      distMap[inc.area] = (distMap[inc.area] || 0) + 1;
    });
    return Object.entries(distMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [metrics.incidents]);

  const sevColor = { critical: '#ef4444', warning: '#f59e0b', success: '#10b981', info: '#6366f1' };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header ─────────────────────────────────────── */}
      <div className="glass-panel animate-slide-up" style={{ padding: '24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, fontSize: 26,
              background: 'linear-gradient(135deg, rgba(239,68,68,0.22), rgba(239,68,68,0.06))',
              border: '1px solid rgba(239,68,68,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>🚨</div>
            <div>
              <h2 className="brand-font" style={{ fontSize: 26, margin: 0 }}>ОПЕРАТИВНЫЙ ЖУРНАЛ ЧС <i>(STRATEGIC)</i></h2>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginTop: 4, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                ДЧС · Служба 112 · МВД РК · Интегринация Сергег ITS
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
               padding: '8px 16px', borderRadius: 10, fontSize: 11, fontWeight: 800,
               background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
               color: '#ef4444', letterSpacing: '1px'
            }}>АКТИВНО: {metrics.incidents.length}</div>
            <div className={`status-badge ${metrics.incidents.length > 10 ? 'danger' : 'warning'}`}>
              {metrics.incidents.length > 10 ? 'КРИТИЧЕСКАЯ НАГРУЗКА' : 'ШТАТНЫЙ РЕЖИМ'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Top Analytical Row ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 20 }}>
        
        {/* District Distribution Bar Chart */}
        <div className="glass-panel animate-slide-up" style={{ padding: 24, animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              🏘️ Распределение по районам
            </div>
            <div className="source-badge">{metrics.sources?.incidents || 'RSS FEED'}</div>
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData} layout="vertical" margin={{ top: 0, right: 30, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-main)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 4, 4, 0]}>
                  {districtData.map((e, i) => (
                    <Cell key={i} fill={e.count > 3 ? '#ef4444' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resource Telemetry */}
        <div className="glass-panel animate-slide-up" style={{ padding: 24, animationDelay: '0.15s' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 20 }}>
            🚑 Ресурсная сводка (Актив/Резерв)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
             {[
               { label: 'Скорая Помощь', val: 42, max: 150, color: '#6366f1' },
               { label: 'Пож. расчеты', val: mode === 'smog' ? 14 : 28, max: 35, color: mode === 'smog' ? '#ef4444' : '#f59e0b' },
               { label: 'Патрули Полиции', val: 108, max: 400, color: '#10b981' }
             ].map(res => (
               <div key={res.label} style={{ textAlign: 'center' }}>
                 <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-bright)', marginBottom: 4 }}>{res.val} <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>/ {res.max}</span></div>
                 <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', marginBottom: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(res.val/res.max)*100}%`, background: res.color }} />
                 </div>
                 <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>{res.label}</div>
               </div>
             ))}
          </div>
          <div style={{ marginTop: 22, height: 100 }}>
             <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>📊 Объем вызовов 112 (12ч)</div>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={hourlyVolume}>
                  <Bar dataKey="incidents" fill="rgba(255,255,255,0.07)" radius={[2,2,0,0]} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── Main Incident Wall ─────────────────────────── */}
      <div className="glass-panel animate-slide-up" style={{ padding: 28, flex: 1, animationDelay: '0.2s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>
            📜 Лента оперативных событий
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Auto-sync: 10s</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {recentIncidents.map((incident) => (
            <div 
              key={incident.id} 
              onClick={() => setExpandedId(expandedId === incident.id ? null : incident.id)}
              style={{ 
                padding: '18px 22px', 
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.05)', 
                borderLeft: `6px solid ${incident.color}`, 
                background: expandedId === incident.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', 
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: expandedId === incident.id ? `0 15px 40px rgba(0,0,0,0.4), 0 0 10px ${incident.color}22` : 'none',
                transform: expandedId === incident.id ? 'scale(1.02)' : 'scale(1)',
                display: 'flex', flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 18 }}>{incident.title?.includes('🔴') ? '🔥' : incident.category === 'ДТП' ? '🚔' : '🚨'}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px' }}>{incident.time} · {incident.area?.toUpperCase() || 'АЛМАТЫ'}</span>
                </div>
                <div style={{ 
                  padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900,
                  background: incident.severity === 'critical' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                  color: incident.severity === 'critical' ? '#ef4444' : '#f59e0b'
                }}>{incident.severity?.toUpperCase() || 'INFO'}</div>
              </div>

              <div style={{ fontSize: 15, fontWeight: 800, color: incident.color, marginBottom: 8, letterSpacing: '-0.2px' }}>
                {incident.title}
              </div>

              <div style={{ 
                fontSize: 13, color: 'var(--text-main)', lineHeight: 1.5, fontWeight: 500,
                display: expandedId === incident.id ? 'block' : '-webkit-box', 
                WebkitLineClamp: expandedId === incident.id ? 'unset' : 2, 
                WebkitBoxOrient: 'vertical', overflow: 'hidden' 
              }}>
                {incident.description}
              </div>

              {expandedId === incident.id && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ЛОКАЦИЯ: <strong style={{ color: 'var(--text-main)' }}>{incident.locationName}</strong></div>
                  <button style={{ 
                    padding: '6px 12px', background: 'var(--color-primary)', border: 'none', borderRadius: 8,
                    color: 'white', fontSize: 10, fontWeight: 800, cursor: 'pointer'
                  }}>ОТПРАВИТЬ ЭКИПАЖ</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IncidentsView;
