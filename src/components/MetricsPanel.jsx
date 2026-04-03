import React, { useMemo } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { HealthRadar, TrendLine } from './Visualizations';
import { fmt, fmtPct, fmtInt } from '../utils.js';
import './Components.css';

const ProgressBar = ({ label, value, color }) => (
  <div className="metric-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px', marginBottom: '28px' }}>
    <div className="flex-between" style={{ width: '100%', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
      <span>{label.toUpperCase()}</span>
      <span style={{ color: color, filter: `drop-shadow(0 0 5px ${color}44)` }}>{fmtPct(value)}</span>
    </div>
    <div className="progress-bg">
      <div className="progress-fill" style={{ 
          width: `${Math.min(100, Math.max(0, value))}%`, 
          backgroundColor: color,
          boxShadow: `0 0 15px ${color}66`
      }} />
    </div>
  </div>
);

const MetricsPanel = () => {
  const { metrics, mode } = useSimulation();

  const getTrafficColor = (val) =>
    val > 80 ? 'var(--color-danger)' : val > 50 ? 'var(--color-warning)' : 'var(--color-success)';

  const trafficTrendData = useMemo(() => [
    { value: Math.max(0, metrics.transport.alfarabi - 15) },
    { value: Math.max(0, metrics.transport.alfarabi - 5) },
    { value: metrics.transport.alfarabi + 10 },
    { value: metrics.transport.alfarabi },
  ], [metrics.transport.alfarabi]);

  return (
    <div className="glass-panel metrics-panel-container animate-slide-up" style={{ animationDelay: '0.15s' }}>

      {/* City Health Radar */}
      <div style={{ paddingBottom: '28px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 className="brand-font" style={{ color: 'var(--text-bright)', textAlign: 'center', marginBottom: '20px', fontSize: '20px', letterSpacing: '2px' }}>БАЛАНС ГОРОДА</h3>
        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.03)' }}>
          <HealthRadar data={metrics} dark />
        </div>
      </div>

      {/* Transport */}
      <div>
        <div className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px', marginBottom: '20px' }}>
          <h3 className="brand-font" style={{ color: 'var(--text-bright)', fontSize: '18px' }}>🚗 ТРАНСПОРТ</h3>
        </div>
        <div className="flex-between" style={{ alignItems: 'flex-end' }}>
          <div style={{ flex: 1, paddingRight: '20px' }}>
            <ProgressBar label="Аль-Фараби" value={metrics.transport.alfarabi} color={getTrafficColor(metrics.transport.alfarabi)} />
          </div>
          <div style={{ paddingBottom: '28px' }}>
            <TrendLine data={trafficTrendData} color={getTrafficColor(metrics.transport.alfarabi)} />
          </div>
        </div>
        <ProgressBar label="Проспект Абая" value={metrics.transport.abay} color={getTrafficColor(metrics.transport.abay)} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
            ИНЦИДЕНТЫ: <span style={{ color: mode === 'smog' ? 'var(--color-danger)' : 'var(--text-bright)', fontWeight: 800 }}>
              {metrics.transport.accidents} АВАРИЙ
            </span>
          </div>
          <div className="source-badge">{metrics.sources?.traffic || 'СВЕРКА...'}</div>
        </div>
      </div>

      {/* Ecology */}
      <div>
        <h3 className="brand-font" style={{ color: 'var(--text-bright)', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px', fontSize: '18px' }}>
          🌿 ЭКОЛОГИЯ
        </h3>
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>AQI (ALMALY)</span>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: metrics.ecology.almalyAQI > 100 ? 'var(--color-danger)' : 'var(--color-warning)', filter: 'drop-shadow(0 0 8px rgba(255,214,10,0.3))' }}>
            {fmtInt(metrics.ecology.almalyAQI)}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
           <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
             <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PM2.5</div>
             <div style={{ fontSize: '14px', fontWeight: 700 }}>{fmt(metrics.ecology.pm2_5, 1)} <small>μg</small></div>
           </div>
           <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
             <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PM10</div>
             <div style={{ fontSize: '14px', fontWeight: 700 }}>{fmt(metrics.ecology.pm10, 1)} <small>μg</small></div>
           </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
            ОЦЕНКА: <span style={{ color: mode === 'smog' ? 'var(--color-danger)' : 'var(--color-warning)', fontWeight: 800 }}>
              {metrics.ecology.overallStatus.toUpperCase()}
            </span>
          </div>
          <div className="source-badge">{metrics.sources?.aqi || 'СВЕРКА...'}</div>
        </div>
      </div>

      {/* Energy & JKH */}
      <div>
        <h3 className="brand-font" style={{ color: 'var(--text-bright)', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px', fontSize: '18px' }}>
          ⚡ ЭНЕРГОСЕТЬ
        </h3>
        <ProgressBar
          label="Нагрузка ТЭЦ"
          value={metrics.advanced.powerLoad}
          color={metrics.advanced.powerLoad > 85 ? 'var(--color-danger)' : 'var(--color-warning)'}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
            АВАРИИ ЖКХ: <span style={{ fontWeight: 800, color: 'var(--text-bright)' }}>{metrics.jkh.activeOutages}</span>
            {' '}| РАДИАЦИЯ: <span style={{ fontWeight: 800, color: metrics.advanced.radiation > 0.23 ? 'var(--color-danger)' : 'var(--color-success)' }}>{fmt(metrics.advanced.radiation, 3)}</span>
          </div>
          <div className="source-badge">{metrics.sources?.power || 'СВЕРКА...'}</div>
        </div>
      </div>

    </div>
  );
};

export default MetricsPanel;
