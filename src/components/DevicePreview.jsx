import React, { useState, useEffect, useCallback, useRef } from 'react';
import './DevicePreview.css';

const DEVICES = [
  {
    id: 'desktop',
    icon: '🖥️',
    label: 'Desktop',
    width: null,
    height: null,
    frameLabel: null,
  },
  {
    id: 'tablet',
    icon: '📱',
    label: 'Tablet',
    shortLabel: 'iPad',
    width: 768,
    height: 1024,
    frameLabel: 'iPad Pro 11"',
    borderRadius: 20,
  },
  {
    id: 'mobile',
    icon: '📲',
    label: 'Mobile',
    shortLabel: 'iPhone',
    width: 390,
    height: 844,
    frameLabel: 'iPhone 14 Pro',
    borderRadius: 40,
  },
];

// Context
export const DeviceContext = React.createContext({ device: 'desktop' });

export const useDevice = () => React.useContext(DeviceContext);

export const DevicePreviewProvider = ({ children }) => {
  const [device, setDevice] = useState('desktop');
  const [scale, setScale] = useState(1);
  const frameRef = useRef(null);
  const containerRef = useRef(null);

  const currentDevice = DEVICES.find((d) => d.id === device);
  const isPreview = device !== 'desktop';

  const calculateScale = useCallback(() => {
    if (!isPreview || !currentDevice) return;
    const padding = 80; // toolbar + margins
    const availH = window.innerHeight - padding - 60; // 60 = toolbar height
    const availW = window.innerWidth - 32;
    const scaleH = availH / currentDevice.height;
    const scaleW = availW / currentDevice.width;
    setScale(Math.min(scaleH, scaleW, 1));
  }, [device, currentDevice, isPreview]);

  useEffect(() => {
    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [calculateScale]);

  // Add class to document body for real-mobile CSS triggers
  useEffect(() => {
    document.documentElement.removeAttribute('data-preview-device');
    if (isPreview) {
      document.documentElement.setAttribute('data-preview-device', device);
    }
  }, [device, isPreview]);

  const frameWidth = isPreview ? currentDevice.width : undefined;
  const frameHeight = isPreview ? currentDevice.height : undefined;

  return (
    <DeviceContext.Provider value={{ device, setDevice, isPreview }}>
      {/* Toolbar */}
      <div className="dp-toolbar glass-panel">
        <div className="dp-toolbar-label">
          <span className="dp-toolbar-icon">📐</span>
          <span>Превью</span>
        </div>

        <div className="dp-device-btns">
          {DEVICES.map((d) => (
            <button
              key={d.id}
              className={`dp-device-btn ${device === d.id ? 'active' : ''}`}
              onClick={() => setDevice(d.id)}
              title={d.label}
            >
              <span className="dp-device-btn-icon">{d.icon}</span>
              <span className="dp-device-btn-label">{d.shortLabel || d.label}</span>
              {d.width && (
                <span className="dp-device-btn-size">
                  {d.width}px
                </span>
              )}
            </button>
          ))}
        </div>

        {isPreview && (
          <div className="dp-info">
            <span className="dp-frame-label">{currentDevice.frameLabel}</span>
            <span className="dp-scale">{Math.round(scale * 100)}%</span>
          </div>
        )}
      </div>

      {/* App Wrapper */}
      {isPreview ? (
        <div className="dp-stage" ref={containerRef}>
          <div
            className="dp-device-outer"
            style={{
              width: frameWidth,
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              borderRadius: currentDevice.borderRadius,
            }}
          >
            {/* Device chrome header */}
            <div className="dp-device-chrome">
              <div className="dp-chrome-notch" />
              <div className="dp-chrome-cam" />
            </div>

            {/* Content frame */}
            <div
              className={`dp-device-screen preview-${device}`}
              ref={frameRef}
              style={{
                width: frameWidth,
                height: frameHeight - 40,
                overflow: 'hidden',
                overflowY: 'auto',
                position: 'relative',
              }}
            >
              {children}
            </div>

            {/* Device home bar */}
            {device === 'mobile' && (
              <div className="dp-home-bar">
                <div className="dp-home-indicator" />
              </div>
            )}
          </div>
        </div>
      ) : (
        children
      )}
    </DeviceContext.Provider>
  );
};
