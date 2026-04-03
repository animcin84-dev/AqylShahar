import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import '../components/Components.css';

const IncidentsView = () => {
  const { metrics, mode } = useSimulation();

  // Take only the top 6 most recent incidents so no scrolling is needed
  const topIncidents = metrics.incidents.slice(0, 6);

  return (
    <div className="glass-panel animate-slide-up flex-col" style={{ gridArea: 'map', gridColumn: 'map / span 2', padding: '24px', overflow: 'hidden' }}>
      <div className="flex-between" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', marginBottom: '16px' }}>
        <h2 className="brand-font" style={{ fontSize: '20px', letterSpacing: '1px' }}>🚨 ОПЕРАТИВНЫЙ ЖУРНАЛ ЧС (БЕЗ ПРОКРУТКИ)</h2>
        <div style={{ background: '#333', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', color: '#fff', textTransform: 'uppercase' }}>
          АКТИВНЫХ ИНЦИДЕНТОВ: {metrics.incidents.length}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', flex: 1, overflow: 'hidden' }}>
        
        {/* Incident Grid Layout that fits on screen */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr 1fr', gap: '8px', height: '100%' }}>
          {topIncidents.map((incident) => (
             <div key={incident.id} style={{ padding: '12px', border: '1px solid #333', borderLeft: `6px solid ${incident.color}`, background: '#0a0a0a', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
               <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                 <span>{incident.time}</span>
                 <span>{incident.area.toUpperCase()}</span>
               </div>
               <strong style={{ color: incident.color, fontSize: '12px', textTransform: 'uppercase' }}>
                 {incident.title}
               </strong>
               <div style={{ fontSize: '11px', marginTop: '6px', color: '#ccc', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                 {incident.description}
               </div>
             </div>
          ))}
        </div>

        {/* Tactical Info Panel */}
        <div style={{ background: '#000', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
          <h4 className="text-muted" style={{ textTransform: 'uppercase', fontSize: '12px', borderBottom: '1px solid #333', paddingBottom: '8px' }}>РЕСУРСНАЯ СВОДКА</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
            <div style={{ background: '#111', padding: '12px', borderLeft: '4px solid #fff' }}>
              <div style={{ fontSize: '10px', color: '#888' }}>СВОБОДНЫЕ СКОРЫЕ СМП</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>42 <span style={{fontSize: '12px', fontWeight: 'normal', color: '#666'}}>/ 150</span></div>
            </div>
            
            <div style={{ background: '#111', padding: '12px', borderLeft: mode === 'smog' ? '4px solid var(--color-danger)' : '4px solid #fff' }}>
              <div style={{ fontSize: '10px', color: '#888' }}>ПОЖАРНЫЕ РАСЧЕТЫ (ПЧ)</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: mode === 'smog' ? 'var(--color-danger)' : '#fff' }}>14 <span style={{fontSize: '12px', fontWeight: 'normal', color: '#666'}}>/ 35</span></div>
            </div>
            
            <div style={{ background: '#111', padding: '12px', borderLeft: '4px solid #fff' }}>
              <div style={{ fontSize: '10px', color: '#888' }}>ПАТРУЛИ ПОЛИЦИИ (ДП)</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>108 <span style={{fontSize: '12px', fontWeight: 'normal', color: '#666'}}>/ 400</span></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default IncidentsView;
