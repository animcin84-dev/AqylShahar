import React, { useState, useEffect } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import './Components.css';

const Header = () => {
  const { metrics, dataScope, setDataScope } = useSimulation();
  const [time, setTime] = useState(new Date());
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  const formatDate = (date) => {
    return date.toLocaleDateString('ru-RU', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const extractPDF = async () => {
    setIsGenerating(true);
    try {
      const reportDiv = document.createElement('div');
      reportDiv.style.position = 'absolute';
      reportDiv.style.left = '-9999px';
      reportDiv.style.top = '-9999px';
      reportDiv.style.width = '800px';
      reportDiv.style.padding = '40px';
      reportDiv.style.background = '#050507';
      reportDiv.style.color = '#ffffff';
      reportDiv.style.fontFamily = 'sans-serif';
      
      const modeText = dataScope === 'fake' ? 'Режим: СИМУЛЯЦИЯ' : 'Режим: LIVE ДАННЫЕ (Реальное время)';
      
      reportDiv.innerHTML = `
        <div style="border: 2px solid rgba(255,255,255,0.1); padding: 40px; border-radius: 20px;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px; color: #0a84ff;">AQYLSHAHAR SPATIAL REPORT</h1>
          <div style="font-size: 11px; opacity: 0.6; margin-top: 8px;">INTELLIGENT URBAN OPERATIONS CENTER | ${time.toLocaleString('ru-RU')}</div>
          
          <div style="margin-top: 30px; background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px;">
            <div style="font-size: 14px; line-height: 1.6;">${metrics?.aiAnalysis?.executive_summary || 'Анализ завершен успешно. Угроз не обнаружено.'}</div>
          </div>

          <h3 style="font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-top: 30px; color: #64d2ff;">📊 КЛЮЧЕВЫЕ ПОКАЗАТЕЛИ (${modeText})</h3>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
            <div style="padding: 15px; border: 1px solid rgba(255,255,255,0.05); border-radius: 8px;">
               <strong>ЭКОЛОГИЯ (AQI):</strong> ${metrics.ecology.almalyAQI} (${metrics.ecology.overallStatus})
            </div>
            <div style="padding: 15px; border: 1px solid rgba(255,255,255,0.05); border-radius: 8px;">
               <strong>ТРАНСПОРТ:</strong> ${metrics.transport.alfarabi.toFixed(1)}% нагрузка
            </div>
            <div style="padding: 15px; border: 1px solid rgba(255,255,255,0.05); border-radius: 8px;">
               <strong>ЭНЕРГЕТИКА:</strong> ${metrics.advanced.powerLoad.toFixed(1)}% нагрузка
            </div>
            <div style="padding: 15px; border: 1px solid rgba(255,255,255,0.05); border-radius: 8px;">
               <strong>СЕЙСМИКА:</strong> ${metrics.seismic.maxQuakeMag.toFixed(1)} Mag
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(reportDiv);

      const canvas = await html2canvas(reportDiv, { backgroundColor: '#050507', scale: 2 });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight()));
      pdf.save(`AQYLSHAHAR_REPORT_${time.getTime()}.pdf`);
      document.body.removeChild(reportDiv);
    } catch (e) {
      console.error("PDF Export failed", e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="glass-panel flex-between animate-slide-up header-main">
      <div className="flex-center" style={{ gap: '24px' }}>
        <div style={{ fontSize: '36px' }}>✨</div>
        <div>
          <h1 className="brand-font" style={{ fontSize: '32px', margin: 0, letterSpacing: '-1px' }}>AqylShahar</h1>
          <div className="text-muted" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.6 }}>Spatial Core v2.0</div>
        </div>
      </div>

      <div className="flex-center" style={{ gap: '32px' }}>
        
        {/* DATA SCOPE TOGGLE (Spatial Control) */}
        <div className="flex-center" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '18px', padding: '6px', gap: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
           <button 
             onClick={() => setDataScope('fake')}
             style={{ background: dataScope === 'fake' ? 'rgba(255,255,255,0.1)' : 'transparent', color: dataScope === 'fake' ? 'var(--text-bright)' : 'var(--text-muted)', border: 'none', padding: '10px 20px', borderRadius: '14px', fontSize: '11px', fontWeight: 'bold', transition: 'all 0.3s' }}>
             СИМУЛЯЦИЯ
           </button>
           <button 
             onClick={() => setDataScope('real')}
             style={{ background: dataScope === 'real' ? 'rgba(255, 69, 58, 0.2)' : 'transparent', border: dataScope === 'real' ? '1px solid rgba(255, 69, 58, 0.3)' : 'none', color: dataScope === 'real' ? '#fff' : 'var(--text-muted)', padding: '10px 20px', borderRadius: '14px', fontSize: '11px', fontWeight: 'bold', transition: 'all 0.3s' }}>
             LIVE ДАННЫЕ
           </button>
        </div>
        
        <div className="flex-center" style={{ gap: '16px' }}>
          <button 
            className="sim-action-btn interactive"
            onClick={extractPDF} 
            disabled={isGenerating}
            title="EXPORT PDF REPORT"
          >
            {isGenerating ? '...' : '📄'}
          </button>
        </div>

        <div className="flex-col" style={{ alignItems: 'flex-end' }}>
          <div className="brand-font" style={{ fontSize: '32px', color: 'var(--text-bright)', letterSpacing: '-1.5px' }}>
            {formatTime(time)}
          </div>
          <div className="text-muted" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
            {formatDate(time)}
          </div>
        </div>

        {metrics.criticalCount > 0 ? (
          <div className="alert-badge pulse-danger flex-center" style={{ background: 'rgba(255, 69, 58, 0.1)', border: '1px solid var(--color-danger)', borderRadius: '24px', padding: '12px 24px', gap: '12px' }}>
            <span style={{ fontSize: '16px' }}>🚨</span>
            <span className="text-danger" style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '0.5px' }}>{metrics.criticalCount} CRISIS</span>
          </div>
        ) : (
          <div className="alert-badge flex-center" style={{ background: 'rgba(50, 215, 75, 0.05)', border: '1px solid var(--color-success)', borderRadius: '24px', padding: '12px 24px', gap: '12px' }}>
            <span style={{ fontSize: '16px' }}>🛡️</span>
            <span className="text-success" style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '0.5px' }}>SECURE OPS</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
