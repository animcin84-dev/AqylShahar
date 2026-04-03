import React, { useState, useEffect } from 'react';
import { useSimulation } from '../context/SimulationContext';
import '../components/Components.css';

const NAV_ITEMS = [
  { view: 'dashboard', icon: '🗺️', title: 'Сводка',    label: 'Сводка'    },
  { view: 'advanced',  icon: '☢️',  title: 'Угрозы',   label: 'Угрозы'    },
  { view: 'transport', icon: '🚗', title: 'Транспорт', label: 'Транспорт' },
  { view: 'ecology',   icon: '🌿', title: 'Экология',  label: 'Экология'  },
  { view: 'jkh',       icon: '🏠', title: 'ЖКХ',       label: 'ЖКХ'       },
  { view: 'incidents', icon: '🚨', title: 'Журнал ЧС', label: 'Журнал ЧС' },
  { view: 'economy',   icon: '🏢', title: 'Экономика', label: 'Экономика' },
  { view: 'ailab',     icon: '🤖', title: 'ИИ Лаб',   label: 'ИИ Лаб'   },
];

const UnifiedNavbar = () => {
  const { currentView, setCurrentView, metrics, dataScope, setDataScope } = useSimulation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hh = time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dd = time.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });

  const isCrisis = metrics.criticalCount > 0;
  const isLive = dataScope === 'real';

  return (
    <div className="glass-panel unified-navbar">

      {/* ── LEFT: Brand ───────────────────────────────── */}
      <div className="nav-brand">
        <div className="nav-brand-icon">
          <span style={{ fontSize: 18 }}>✨</span>
        </div>
        <div className="nav-brand-text">
          <div className="nav-brand-name">AqylShahar</div>
          <div className="nav-brand-sub">Spatial Core v2.4</div>
        </div>

        <div className="nav-separator" />

        {/* Live Clock */}
        <div className="nav-clock">
          <div className="nav-clock-time">{hh}</div>
          <div className="nav-clock-date">{dd}</div>
        </div>
      </div>

      {/* ── CENTER: Navigation ───────────────────────── */}
      <div className="nav-section-center">

        {/* Full Map */}
        <button
          className={`nav-item ${currentView === 'fullmap' ? 'active' : ''}`}
          onClick={() => setCurrentView('fullmap')}
          title="Полная карта"
        >
          <span className="nav-item-icon">🌐</span>
          <span className="nav-item-label">Карта</span>
          {currentView === 'fullmap' && <span className="nav-active-dot" />}
        </button>

        <div className="nav-separator mini" />

        {NAV_ITEMS.map(({ view, icon, label }) => (
          <button
            key={view}
            className={`nav-item ${currentView === view ? 'active' : ''}`}
            onClick={() => setCurrentView(view)}
          >
            <span className="nav-item-icon">{icon}</span>
            <span className="nav-item-label">{label}</span>
            {currentView === view && <span className="nav-active-dot" />}
          </button>
        ))}
      </div>

      {/* ── RIGHT: Controls + Status ─────────────────── */}
      <div className="nav-section-right">

        {/* SIM / LIVE toggle */}
        <div className="nav-scope-toggle">
          <button
            className={`scope-btn ${!isLive ? 'active-sim' : ''}`}
            onClick={() => setDataScope('fake')}
          >
            <span className="scope-dot sim" />
            SIM
          </button>
          <button
            className={`scope-btn ${isLive ? 'active-live' : ''}`}
            onClick={() => setDataScope('real')}
          >
            <span className="scope-dot live" />
            LIVE
          </button>
        </div>

        {/* Status badge */}
        <div className={`nav-status-badge ${isCrisis ? 'crisis' : 'secure'}`}>
          <div className={`live-dot ${isCrisis ? 'danger' : ''}`} />
          <span>{isCrisis ? `${metrics.criticalCount} CRISIS` : '🛡️ SECURE OPS'}</span>
        </div>

      </div>
    </div>
  );
};

export default UnifiedNavbar;
