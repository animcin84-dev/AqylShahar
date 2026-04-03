import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ALMATY_ROAD_VECTORS, interpolateRoad } from '../data/roadVectors';
import './Components.css';

const ALMATY_CENTER = [43.238949, 76.889709];

const COLORS = {
  safe: '#32d74b',
  warning: '#ffd60a',
  danger: '#ff453a',
  critical: '#bf5af2',
  info: '#64d2ff',
};

const MapPanel = ({ fullScreen }) => {
  const { mode, metrics, dataScope } = useSimulation();

  const generateTrafficSegments = (routeVectors, overallTrafficPercent) => {
    const microSegments = interpolateRoad(routeVectors, 5);
    return microSegments.map(positions => {
      const variance = (Math.random() * 40) - 20;
      const local = overallTrafficPercent + variance;
      let color = COLORS.safe;
      if (local > 55) color = COLORS.warning;
      if (local > 80) color = COLORS.danger;
      if (local > 96) color = COLORS.critical;
      if (mode === 'smog') color = Math.random() > 0.5 ? COLORS.danger : COLORS.critical;
      return { positions, color };
    });
  };

  const roadsToRender = React.useMemo(() => {
    return [
      { key: 'alfarabi',   coords: ALMATY_ROAD_VECTORS.alfarabi,   traffic: metrics.transport.alfarabi,   name: 'АЛЬ-ФАРАБИ' },
      { key: 'abay',       coords: ALMATY_ROAD_VECTORS.abay,       traffic: metrics.transport.abay,       name: 'АБАЯ' },
      { key: 'seifullin',  coords: ALMATY_ROAD_VECTORS.seifullin,  traffic: (metrics.transport.alfarabi + metrics.transport.abay) / 2, name: 'СЕЙФУЛЛИНА' },
      { key: 'dostyk',     coords: ALMATY_ROAD_VECTORS.dostyk,     traffic: metrics.transport.dostyk,     name: 'ДОСТЫК' },
      { key: 'rozybakieva',coords: ALMATY_ROAD_VECTORS.rozybakieva,traffic: metrics.transport.rozybakieva,name: 'РОЗЫБАКИЕВА' },
    ].map(road => ({ ...road, segments: generateTrafficSegments(road.coords, road.traffic) }));
  }, [metrics.transport, mode]);

  return (
    <div
      className={`glass-panel map-panel-container ${fullScreen ? 'fullmap-active animate-slide-up' : 'animate-slide-up'}`}
      style={{ padding: 0, background: '#050507' }}
    >
      {/* Tactical overlay label */}
      <div style={{
        position: 'absolute', top: 24, left: 24, zIndex: 1000,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(16px)',
        padding: '10px 20px', borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.15)',
        pointerEvents: 'none',
      }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', letterSpacing: '1px' }}>AQYLSHAHAR TACTICAL MAP v2.4</div>
        <div style={{ fontSize: '10px', color: COLORS.info, marginTop: '3px', fontWeight: 700 }}>LIVE VECTOR SYNC · ALMATY</div>
      </div>

      <MapContainer center={ALMATY_CENTER} zoom={12.5} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
        />

        {/* Incident markers */}
        {metrics.incidents.map(inc => (
          <CircleMarker key={inc.id} center={inc.coords} radius={inc.category === 'ДТП' ? 13 : 9}
            pathOptions={{ color: '#fff', fillColor: inc.color, fillOpacity: 1, weight: 3 }}
          >
            <Tooltip direction="top" offset={[0,-10]}>
              <strong style={{ color: '#fff', textTransform: 'uppercase' }}>{inc.title}</strong>
            </Tooltip>
            <Popup>
              <div style={{ background: '#050507', color: '#fff', padding: '18px', borderRadius: '20px', border: `2px solid ${inc.color}`, minWidth: '260px', fontSize: '13px' }}>
                <div style={{ color: inc.color, fontWeight: 900, marginBottom: '10px', textTransform: 'uppercase' }}>{inc.title}</div>
                <div style={{ color: '#8e8e93', lineHeight: 1.6 }}>{inc.description}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Live Google Maps traffic overlay */}
        <TileLayer
          url="https://mt0.google.com/vt/lyrs=h,traffic&hl=ru&x={x}&y={y}&z={z}"
          opacity={mode === 'smog' ? 0.3 : 0.7}
          zIndex={10}
          attribution="&copy; Google Maps Traffic"
        />

        {/* Simulated tactical road vectors */}
        {(dataScope === 'fake' || mode === 'smog') && roadsToRender.map(road => (
          <React.Fragment key={road.key}>
            {road.segments.map((seg, idx) => (
              <Polyline key={`${road.key}_${idx}`} positions={seg.positions}
                pathOptions={{ color: seg.color, weight: 5, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }} />
            ))}
          </React.Fragment>
        ))}

        {/* POI Markers */}
        <CircleMarker center={[43.155, 77.050]} radius={11} pathOptions={{ color: COLORS.info, fillColor: 'rgba(0,0,0,0.5)', weight: 3, fillOpacity: 1 }}>
          <Tooltip direction="top"><strong>DAM: MEDEO</strong></Tooltip>
        </CircleMarker>
        <CircleMarker center={[43.340, 76.920]} radius={11} pathOptions={{ color: COLORS.warning, fillColor: 'rgba(0,0,0,0.5)', weight: 3, fillOpacity: 1 }}>
          <Tooltip direction="top"><strong>POWER: TЭЦ-1</strong></Tooltip>
        </CircleMarker>
        <CircleMarker center={[43.220, 76.910]} radius={11} pathOptions={{ color: COLORS.danger, fillColor: 'rgba(0,0,0,0.5)', weight: 3, fillOpacity: 1 }}>
          <Tooltip direction="top"><strong>MEDICAL: BSMP</strong></Tooltip>
        </CircleMarker>
      </MapContainer>
    </div>
  );
};

export default MapPanel;
