import React, { createContext, useContext, useState } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map(t => (
          <div key={t.id} className={`glass-panel animate-slide-up ${t.type === 'danger' ? 'pulse-danger' : ''}`} style={{ padding: '12px 20px', minWidth: '250px', background: t.type === 'danger' ? 'var(--color-danger-glow)' : 'var(--bg-glass)' }}>
            <span className="mono-font" style={{ color: '#fff', fontSize: '12px' }}>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
