import React from 'react';
import { SimulationProvider, useSimulation } from './context/SimulationContext';
import Sidebar from './components/Sidebar'; // UnifiedNavbar
import MapPanel from './components/MapPanel';
import MetricsPanel from './components/MetricsPanel';
import AIAnalyst from './components/AIAnalyst';

// Sub Views
import EcologyView from './views/EcologyView';
import TransportView from './views/TransportView';
import JkhView from './views/JkhView';
import IncidentsView from './views/IncidentsView';
import EconomyView from './views/EconomyView';
import AdvancedTechView from './views/AdvancedTechView';

import { useToast } from './components/ToastProvider';

const MainContent = () => {
  const { currentView } = useSimulation();

  if (currentView === 'fullmap') {
    return <MapPanel fullScreen />;
  }

  return (
    <div className="main-viewport-content">
      {currentView === 'dashboard' && (
        <div className="dashboard-grid">
          <MapPanel />
          <MetricsPanel />
        </div>
      )}
      {currentView === 'ailab'     && <AIAnalyst />}
      {currentView === 'ecology'   && <EcologyView />}
      {currentView === 'transport' && <TransportView />}
      {currentView === 'jkh'       && <JkhView />}
      {currentView === 'incidents' && <IncidentsView />}
      {currentView === 'economy'   && <EconomyView />}
      {currentView === 'advanced'  && <AdvancedTechView />}
    </div>
  );
};

const LayoutContainer = () => {
  const { currentView, setCurrentView } = useSimulation();
  const { addToast } = useToast() || { addToast: () => {} };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F11' || (e.ctrlKey && e.key === 'p')) {
        e.preventDefault();
        if (!document.documentElement.requestFullscreen) return;
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          if (addToast) addToast('Режим презентации включён', 'info');
        } else {
          document.exitFullscreen();
          if (addToast) addToast('Режим презентации отключён', 'info');
        }
      }
      if (e.altKey && e.key === '1') setCurrentView('dashboard');
      if (e.altKey && e.key === '2') setCurrentView('fullmap');
      if (e.altKey && e.key === '3') setCurrentView('ecology');
      if (e.altKey && e.key === '4') setCurrentView('ailab');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentView, addToast]);

  return (
    <div className="app-root-container">
      {/* Subtle scanline texture for depth */}
      <div className="scanlines" />
      {/* Always-visible unified navbar */}
      <Sidebar />
      {/* All page content */}
      <MainContent />
    </div>
  );
};

function App() {
  return (
    <SimulationProvider>
      <LayoutContainer />
    </SimulationProvider>
  );
}

export default App;
