import React from 'react';
import './Components.css'; // Reusing existing CSS or global glass-panel styles

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)', padding: '24px' }}>
          <div className="glass-panel pulse-danger" style={{ maxWidth: '600px', width: '100%' }}>
            <h1 className="brand-font text-danger" style={{ marginBottom: '16px' }}>КРИТИЧЕСКАЯ СИСТЕМНАЯ ОШИБКА</h1>
            <p style={{ marginBottom: '16px' }}>Произошел некритический сбой UI. Ядро AI продолжает работу, но интерфейс был остановлен для безопасности.</p>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '4px', overflowX: 'auto', marginBottom: '16px', border: '1px solid var(--border-glass)' }}>
              <code className="mono-font text-warning" style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </code>
            </div>
            <button 
              className="interactive"
              onClick={() => window.location.reload()} 
              style={{ background: 'var(--color-danger)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold' }}
            >
              ПЕРЕЗАГРУЗИТЬ ТЕРМИНАЛ
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
