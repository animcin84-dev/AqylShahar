import React, { useState, useEffect, useRef } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { fmt, fmtPct, fmtInt } from '../utils.js';
import './Components.css';

// ─── DATA TICKER ──────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  '🛰️ USGS: Сейсмосеть онлайн — 32 датчика работают стабильно',
  '☁️ OpenMeteo: AQI-данные обновлены, отклонений нет',
  '🌊 OpenAQ: 16 активных станций Алматы передали пакет данных',
  '⚡ KEEG.kz: Телеметрия подстанций загружена (142 узла)',
  '📡 Safecast: Радиационный скан завершён — фон в норме',
  '💹 ExchangeRate: Валютный калькулятор риска синхронизирован',
  '🔴 CORE: LLM-ядро LLaMA 3 ожидает директивы',
  '🚦 Sergek ITS: Скоростные потоки Аль-Фараби оцифрованы',
  '🚨 112 API: Шлюз вызовов скорой помощи интегрирован',
  '📲 Open Almaty: Парсинг 2,400 жалоб граждан за 60 минут',
  '💧 Казгидромет: Уровень сброса плотины БАО обновлён',
  '🚁 ДЧС Радар: Спасательные борта в режиме standby',
];

// ─── QUICK PROMPTS ────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { label: '🚦 Пробки',   icon: '🚦', q: 'Оцени транспортную ситуацию и дай конкретные рекомендации по разгрузке.' },
  { label: '☁️ Смог',    icon: '☁️', q: 'Анализ качества воздуха. Нужны ли ограничения для промышленности?' },
  { label: '⚡ Блэкаут', icon: '⚡', q: 'Нагрузка на энергосети критическая. Какие районы отключить первыми?' },
  { label: '🌊 Дамба',   icon: '🌊', q: 'Прогноз по уровню рек и риску паводка на 24 часа.' },
  { label: '🚨 ЧС план', icon: '🚨', q: 'Сгенерируй план первоочередных мероприятий при объявлении ЧС.' },
  { label: '📊 Сводка',  icon: '📊', q: 'Полная управленческая сводка: экология, транспорт, энергетика, сейсмика.' },
];

// ─── ANIMATED ORB ─────────────────────────────────────────────────────────────
const AIOrb = ({ loading, crisis }) => {
  const color = crisis ? '#ef4444' : loading ? '#f59e0b' : '#6366f1';
  const glow  = crisis ? 'rgba(239,68,68,0.5)' : loading ? 'rgba(245,158,11,0.4)' : 'rgba(99,102,241,0.4)';
  
  return (
    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer Glow 1: Rotating Ring */}
      <div style={{
        position: 'absolute', inset: -8, borderRadius: '50%',
        border: `1px dashed ${color}33`,
        animation: 'spin-slow 12s linear infinite',
      }} />

      {/* Outer Glow 2: Fast Pulse Ring */}
      <div style={{
        position: 'absolute', inset: -4, borderRadius: '50%',
        border: `1px solid ${color}44`,
        animation: loading || crisis ? 'orb-ring 2s ease-out infinite' : 'glowPulse 4s ease-in-out infinite',
      }} />

      {/* The Core Orb SVG */}
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, ${color}ff 0%, ${crisis ? '#450a0a' : '#1e1b4b'} 100%)`,
        boxShadow: `0 0 30px ${glow}, inset 0 0 15px rgba(255,255,255,0.35)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zize: 2,
        animation: loading ? 'orb-spin 3s linear infinite' : 'orb-float 4s ease-in-out infinite',
      }}>
        {/* Central Icon / SVG Lineart */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          {crisis ? (
            <path d="M12 2L1 21H23L12 2ZM12 17H13V15H11V17H12ZM12 13V9H11V13H12Z" fill="white" style={{ filter: 'drop-shadow(0 0 5px white)' }} />
          ) : loading ? (
            <path d="M12 2V4M12 20V22M4 12H2M22 12H20M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M19.07 19.07L17.66 17.66M6.34 6.34L4.93 4.93" 
              stroke="white" strokeWidth="2" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 5px white)' }} />
          ) : (
            <path d="M12 2L14.5 9.5H22L16 14L18.5 21.5L12 17L5.5 21.5L8 14L2 9.5H9.5L12 2Z" fill="white" style={{ filter: 'drop-shadow(0 0 5px white)' }} />
          )}
        </svg>
      </div>

      {/* Orbiting particle (simulated with before/after) */}
      <div style={{
        position: 'absolute', inset: -12, borderRadius: '50%',
        border: `1px solid transparent`,
        animation: 'spin-slow 6s linear infinite',
      }} className="orb-overlay">
         <div style={{ 
           position: 'absolute', top: 0, left: '50%', width: 4, height: 4, 
           background: 'white', borderRadius: '50%', boxShadow: '0 0 10px white' 
         }} />
      </div>
    </div>
  );
};

// ─── METRIC CHIP ──────────────────────────────────────────────────────────────
const MetricChip = ({ label, val, unit, danger, warn }) => {
  const color = danger ? '#ef4444' : warn ? '#f59e0b' : '#10b981';
  const bg    = danger ? 'rgba(239,68,68,0.08)' : warn ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)';
  const bd    = danger ? 'rgba(239,68,68,0.25)' : warn ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.20)';
  return (
    <div style={{
      background: bg, border: `1px solid ${bd}`, borderRadius: 10,
      padding: '8px 14px', textAlign: 'center', minWidth: 80, flexShrink: 0,
      transition: 'all 0.4s ease',
    }}>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {val}<span style={{ fontSize: 10, fontWeight: 500, marginLeft: 2, opacity: 0.7 }}>{unit}</span>
      </div>
    </div>
  );
};

// ─── THREAT ITEM ──────────────────────────────────────────────────────────────
const ThreatItem = ({ text, index }) => {
  const colors = ['#ef4444', '#f59e0b', '#6366f1', '#10b981', '#06b6d4'];
  const c = colors[index % colors.length];
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      padding: '10px 14px', borderRadius: 10,
      background: `${c}08`,
      border: `1px solid ${c}20`,
      marginBottom: 8,
      animation: `slideUpFade 0.3s ease-out ${index * 0.08}s both`,
    }}>
      <div style={{ width: 3, minWidth: 3, alignSelf: 'stretch', borderRadius: 4, background: c, opacity: 0.7 }} />
      <div style={{ fontSize: 12, color: 'var(--text-main)', lineHeight: 1.65 }}>{text}</div>
    </div>
  );
};

// ─── ACTION ITEM ──────────────────────────────────────────────────────────────
const ActionItem = ({ text, index }) => (
  <div style={{
    display: 'flex', gap: 10, alignItems: 'flex-start',
    padding: '10px 14px', borderRadius: 10,
    background: 'rgba(16,185,129,0.06)',
    border: '1px solid rgba(16,185,129,0.18)',
    marginBottom: 8,
    animation: `slideUpFade 0.3s ease-out ${index * 0.08}s both`,
  }}>
    <div style={{
      width: 20, height: 20, minWidth: 20, borderRadius: 6,
      background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontWeight: 800, color: '#10b981',
    }}>{index + 1}</div>
    <div style={{ fontSize: 12, color: 'var(--text-main)', lineHeight: 1.65 }}>{text}</div>
  </div>
);

// ─── CHAT MESSAGE ─────────────────────────────────────────────────────────────
const ChatMessage = ({ msg, isLast }) => {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      display: 'flex', flexDirection: 'column',
      maxWidth: '84%',
      animation: isLast ? 'slideUpFade 0.25s ease-out' : undefined,
    }}>
      {/* Label */}
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '1.2px',
        color: isUser ? 'var(--text-muted)' : 'var(--color-primary)',
        marginBottom: 5,
        textAlign: isUser ? 'right' : 'left',
        textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', gap: 6,
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}>
        {!isUser && <span>🤖</span>}
        {isUser ? '👤 АКИМ' : 'LLAMA3 · НЕЙРОСОВЕТНИК'}
        {!isUser && (
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
            · {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {isUser && <span>👤</span>}
      </div>

      {/* Bubble */}
      <div style={{
        background: isUser
          ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))'
          : 'rgba(255,255,255,0.03)',
        border: isUser
          ? '1px solid rgba(99,102,241,0.35)'
          : '1px solid rgba(255,255,255,0.07)',
        borderLeft: !isUser ? '3px solid var(--color-primary)' : undefined,
        padding: '12px 16px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
        color: isUser ? '#e8e8ff' : 'var(--text-main)',
        fontSize: 13, lineHeight: 1.75,
        whiteSpace: 'pre-wrap',
        boxShadow: isUser
          ? '0 4px 20px rgba(99,102,241,0.12)'
          : '0 4px 20px rgba(0,0,0,0.3)',
      }}>
        {msg.text || <span style={{ color: 'var(--text-muted)' }} className="typing-line">обрабатываю...</span>}
      </div>
    </div>
  );
};

// ─── CRISIS PANEL ─────────────────────────────────────────────────────────────
const CrisisPanel = ({ mode, onTrigger, onReset }) => {
  const isActive = mode === 'smog';
  return (
    <div style={{
      borderRadius: 16,
      background: isActive
        ? 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.06))'
        : 'rgba(255,255,255,0.025)',
      border: isActive ? '1px solid rgba(239,68,68,0.45)' : '1px solid rgba(255,255,255,0.07)',
      padding: '16px 18px',
      transition: 'all 0.5s ease',
      boxShadow: isActive ? '0 0 30px rgba(239,68,68,0.12) inset' : 'none',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase',
            color: isActive ? '#ef4444' : 'var(--text-muted)', marginBottom: 4,
          }}>
            {isActive ? '🔴 СИМУЛЯЦИЯ АКТИВНА' : '⚡ ПРЕДИКТОР КРИЗИСА'}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#fca5a5' : 'var(--text-main)' }}>
            {isActive ? 'УГРОЗА: БЛЭКАУТ + СМОГ + ПАВОДОК' : 'Многофакторный кризис-сценарий'}
          </div>
        </div>
        <button
          onClick={isActive ? onReset : onTrigger}
          style={{
            background: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${isActive ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'}`,
            color: isActive ? '#10b981' : '#ef4444',
            padding: '8px 16px', borderRadius: 10, fontWeight: 800,
            fontSize: 10, cursor: 'pointer', letterSpacing: '1px',
            transition: 'all 0.25s', whiteSpace: 'nowrap',
          }}
        >
          {isActive ? '🔄 СБРОС' : '⚡ ЗАПУСТИТЬ'}
        </button>
      </div>

      {/* Metrics grid */}
      {isActive ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {[
            { label: 'AQI', val: '178', unit: 'PM2.5' },
            { label: 'ТЭЦ нагрузка', val: '99%', unit: '' },
            { label: 'Трафик', val: '98%', unit: '' },
            { label: 'Соц. напряж.', val: '8500', unit: 'ед' },
          ].map(({ label, val, unit }) => (
            <div key={label} style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 8, padding: '8px 10px',
            }}>
              <div style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#ef4444' }}>
                {val}<span style={{ fontSize: 10, marginLeft: 2, opacity: 0.6 }}>{unit}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7, marginTop: 4 }}>
          Симулирует: AQI 178 · Нагрузку ТЭЦ 99% · Транспортный коллапс · Соцнапряжение 8500 ед.
          ИИ генерирует антикризисные директивы в реальном времени.
        </div>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const AIAnalyst = () => {
  const {
    aiAnalysis, isAiLoading, mode, metrics, currentView,
    triggerSmogSimulation, resetSimulation,
    aiChatHistory, setAiChatHistory, isAiThinking, handleAskAI,
  } = useSimulation();

  const isFullView = currentView === 'ailab';
  const [tickerIdx, setTickerIdx]  = useState(0);
  const [inputVal,  setInputVal]   = useState('');
  const [activeTab, setActiveTab]  = useState('threats'); // threats | actions | summary
  const chatEndRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setTickerIdx(p => (p + 1) % TICKER_ITEMS.length), 3500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChatHistory]);

  const onSend = async (e, quickPrompt = null) => {
    e?.preventDefault();
    const q = quickPrompt || inputVal;
    if (!q.trim() || isAiThinking) return;
    if (!quickPrompt) setInputVal('');
    await handleAskAI(q, metrics);
  };

  const isCrisis = mode === 'smog';
  const statusColor = isCrisis ? '#ef4444' : isAiLoading ? '#f59e0b' : (aiAnalysis?.statusColor || '#6366f1');
  const statusLabel = isCrisis
    ? '🔴 КРИЗИСНЫЙ РЕЖИМ'
    : isAiLoading
    ? '⏳ АНАЛИЗ...'
    : (aiAnalysis?.analysisLabel || '🟢 СИСТЕМА ГОТОВА');

  // ────────────────────────────────────────────────────────────────────────────
  // COMPACT MODE
  // ────────────────────────────────────────────────────────────────────────────
  if (!isFullView) {
    return (
      <div className="glass-panel animate-slide-up" style={{
        width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        border: isCrisis ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--border-glass)',
        minHeight: 'calc(100vh - 200px)',
        background: 'rgba(6,6,16,0.85)',
      }}>
        {isCrisis && <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 80px rgba(239,68,68,0.12)', zIndex: 0, pointerEvents: 'none' }} />}

        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.4)', zIndex: 1, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AIOrb loading={isAiLoading} crisis={isCrisis} />
            <div>
              <div className="brand-font" style={{ fontSize: 14, letterSpacing: '-0.3px' }}>ПРЕДИКТИВНАЯ ИИ МОДЕЛЬ <span style={{ background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>v6.0</span></div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 2 }}>LLaMA 3 · 34 LIVE FEEDS · НЕЙРОСОВЕТНИК</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }} className="typing-line">{TICKER_ITEMS[tickerIdx]}</div>
            <div style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 9, fontWeight: 800, letterSpacing: '1px',
              background: `${statusColor}18`, border: `1px solid ${statusColor}50`, color: statusColor,
            }}>{statusLabel}</div>
          </div>
        </div>

        {/* 3-col body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr 1.5fr', flex: 1, overflow: 'hidden', zIndex: 1 }}>

          {/* Col 1: Summary */}
          <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', padding: '16px 18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 9, color: 'var(--color-primary)', letterSpacing: '2px', fontWeight: 800, textTransform: 'uppercase' }}>▶ НЕЙРО-СТАТУС</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: statusColor, lineHeight: 1.2 }}>{statusLabel}</div>
            <p style={{ color: 'var(--text-main)', fontSize: 12, lineHeight: 1.75, opacity: 0.85 }}>
              {isAiLoading ? '⌛ LLaMA 3 анализирует данные датчиков...' : (aiAnalysis?.executive_summary || 'Ожидание данных от агрегаторов...')}
            </p>
          </div>

          {/* Col 2: Threats */}
          <div style={{ padding: '16px 18px', borderRight: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto' }}>
            <div style={{ fontSize: 9, color: '#ef4444', letterSpacing: '2px', fontWeight: 800, textTransform: 'uppercase', marginBottom: 10 }}>▶ УГРОЗЫ</div>
            {isAiLoading ? (
              <div style={{ color: 'var(--color-primary)', fontSize: 11 }} className="typing-line">LLaMA 3: генерация...</div>
            ) : (
              (aiAnalysis?.threat_analysis || ['Инициализация модели...']).map((t, i) => <ThreatItem key={i} text={t} index={i} />)
            )}
          </div>

          {/* Col 3: Chat */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}>
              ИНТЕРАКТИВНЫЙ АКИМАТ-КОПЛИОТ
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {aiChatHistory.slice(-4).map((msg, i) => (
                <div key={i} style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.role === 'user' ? 'rgba(99,102,241,0.15)' : 'transparent',
                  borderLeft: msg.role === 'ai' ? '2px solid var(--color-primary)' : 'none',
                  border: msg.role === 'user' ? '1px solid rgba(99,102,241,0.3)' : 'none',
                  borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : 0,
                  padding: msg.role === 'user' ? '6px 10px' : '0 10px',
                  maxWidth: '90%',
                  color: msg.role === 'user' ? '#e8e8ff' : 'var(--text-main)',
                  fontSize: 11, lineHeight: 1.6,
                }}>
                  {msg.role === 'ai' && <div style={{ fontSize: 8, color: 'var(--color-primary)', marginBottom: 3, fontWeight: 800, letterSpacing: '1px' }}>LLAMA3 COPILOT</div>}
                  {msg.text.length > 220 ? msg.text.substring(0, 220) + '...' : msg.text}
                </div>
              ))}
              {isAiThinking && (
                <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: 11, paddingLeft: 10, borderLeft: '2px solid var(--color-primary)' }} className="typing-line">
                  LLaMA 3 думает...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: '8px 10px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}>
              <form onSubmit={onSend} style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text" value={inputVal} onChange={e => setInputVal(e.target.value)}
                  placeholder="Вопрос Акима..."
                  style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '6px 12px', borderRadius: 20, outline: 'none', fontSize: 11, fontFamily: 'inherit' }}
                />
                <button type="submit" disabled={isAiThinking || !inputVal.trim()} style={{
                  background: 'var(--color-primary)', color: '#fff', border: 'none',
                  padding: '6px 14px', borderRadius: 20, fontWeight: 800, cursor: 'pointer',
                  fontSize: 11, opacity: (isAiThinking || !inputVal.trim()) ? 0.4 : 1, transition: 'opacity 0.2s',
                }}>↑</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // FULL AI LAB VIEW
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="animate-slide-up" style={{
      width: '100%', minHeight: 'calc(100vh - 180px)',
      display: 'grid', gridTemplateColumns: '370px 1fr',
      gap: 20, position: 'relative',
    }}>

      {/* ── LEFT PANEL ────────────────────────────────────────────────────── */}
      <div className="glass-panel" style={{
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        border: isCrisis ? '1px solid rgba(239,68,68,0.45)' : '1px solid var(--border-glass)',
        background: 'rgba(6,6,18,0.90)',
      }}>
        {/* AI Identity Header */}
        <div style={{
          padding: '24px 24px 20px',
          background: isCrisis
            ? 'linear-gradient(180deg, rgba(239,68,68,0.10) 0%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <AIOrb loading={isAiLoading} crisis={isCrisis} />
            <div>
              <h2 className="brand-font" style={{ fontSize: 20, margin: 0, letterSpacing: '-0.5px' }}>
                ИИ ЛАБОРАТОРИЯ
              </h2>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase', marginTop: 3 }}>
                AqylShahar Core · LLaMA 3
              </div>
            </div>
          </div>

          {/* Status pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px', borderRadius: 12,
            background: `${statusColor}12`, border: `1px solid ${statusColor}35`,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: statusColor, letterSpacing: '0.5px' }}>{statusLabel}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>34 API FEEDS · НЕЙРОСЕТЬ АКТИВНА</div>
            </div>
            {isAiLoading && (
              <div style={{ marginLeft: 'auto', width: 16, height: 16, border: `2px solid ${statusColor}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'orb-spin 0.7s linear infinite' }} />
            )}
          </div>
        </div>

        {/* Tab nav */}
        <div style={{
          display: 'flex', gap: 0, flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.3)',
        }}>
          {[
            { id: 'summary', label: '📋 Сводка' },
            { id: 'threats', label: '⚠️ Угрозы' },
            { id: 'actions', label: '✅ Директивы' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: '10px 4px', border: 'none', cursor: 'pointer',
              background: activeTab === tab.id ? 'rgba(99,102,241,0.12)' : 'transparent',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--text-muted)',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}>{tab.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
          {isAiLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[80, 60, 90, 45, 70].map((w, i) => (
                <div key={i} className="shimmer" style={{ height: 14, width: `${w}%`, borderRadius: 7 }} />
              ))}
            </div>
          ) : (
            <>
              {activeTab === 'summary' && (
                <div>
                  <div style={{ fontSize: 9, color: 'var(--color-primary)', letterSpacing: '2px', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>▶ ИСПОЛНИТЕЛЬНАЯ СВОДКА</div>
                  <p style={{ color: 'var(--text-main)', fontSize: 13, lineHeight: 1.8, opacity: 0.9 }}>
                    {aiAnalysis?.executive_summary || 'Ожидание данных от агрегаторов... Система инициализируется.'}
                  </p>
                </div>
              )}
              {activeTab === 'threats' && (
                <div>
                  <div style={{ fontSize: 9, color: '#ef4444', letterSpacing: '2px', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>▶ НЕЙРО-АНАЛИЗ УГРОЗ</div>
                  {(aiAnalysis?.threat_analysis || ['Модель инициализируется...']).map((t, i) => (
                    <ThreatItem key={i} text={t} index={i} />
                  ))}
                </div>
              )}
              {activeTab === 'actions' && (
                <div>
                  <div style={{ fontSize: 9, color: '#10b981', letterSpacing: '2px', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>▶ ДИРЕКТИВЫ АКИМАТА</div>
                  {(aiAnalysis?.recommended_actions?.length > 0
                    ? aiAnalysis.recommended_actions
                    : ['Ожидание рекомендаций...']
                  ).map((a, i) => <ActionItem key={i} text={a} index={i} />)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Ticker */}
        <div style={{
          padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.4)', flexShrink: 0,
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }} className="typing-line">
            {TICKER_ITEMS[tickerIdx]}
          </div>
        </div>

        {/* Crisis Panel */}
        <div style={{ padding: '12px 16px 16px', background: 'rgba(0,0,0,0.3)', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 10, fontWeight: 700 }}>
            СЦЕНАРИИ СИМУЛЯЦИИ
          </div>
          <CrisisPanel mode={mode} onTrigger={triggerSmogSimulation} onReset={resetSimulation} />
        </div>
      </div>

      {/* ── RIGHT PANEL: CHAT ─────────────────────────────────────────────── */}
      <div className="glass-panel" style={{
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        background: 'rgba(6,6,18,0.90)',
      }}>
        {/* Chat header */}
        <div style={{
          padding: '18px 24px 16px',
          background: 'linear-gradient(180deg, rgba(99,102,241,0.06) 0%, transparent 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h3 className="brand-font" style={{ fontSize: 16, margin: 0 }}>Акимат-Коплиот</h3>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase', marginTop: 3 }}>
                Интерактивный ИИ-советник города
              </div>
            </div>
            <button
              onClick={() => setAiChatHistory([{ role: 'ai', text: '[ЛОГ ОЧИЩЕН] Готов к новой сессии анализа.' }])}
              style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text-muted)', padding: '6px 14px', borderRadius: 8,
                fontSize: 10, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              🗑 Очистить лог
            </button>
          </div>

          {/* Quick prompts */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {QUICK_PROMPTS.map(({ label, q }) => (
              <button
                key={label}
                onClick={e => onSend(e, q)}
                disabled={isAiThinking}
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                  color: 'var(--text-muted)', padding: '6px 14px', borderRadius: 20,
                  fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                  transition: 'all 0.2s', opacity: isAiThinking ? 0.4 : 1,
                }}
                onMouseEnter={e => { if (!isAiThinking) { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Live metrics strip */}
        <div style={{
          display: 'flex', gap: 10, padding: '12px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          overflowX: 'auto', flexShrink: 0,
          background: 'rgba(0,0,0,0.3)',
        }}>
          <MetricChip label="AQI"       val={fmtInt(metrics.ecology.almalyAQI)}       unit=""      danger={metrics.ecology.almalyAQI > 100} warn={metrics.ecology.almalyAQI > 75} />
          <MetricChip label="Аль-Фараби" val={fmtPct(metrics.transport.alfarabi)}     unit=""      danger={metrics.transport.alfarabi > 85} warn={metrics.transport.alfarabi > 65} />
          <MetricChip label="ТЭЦ"       val={fmtPct(metrics.advanced.powerLoad)}      unit=""      danger={metrics.advanced.powerLoad > 90} warn={metrics.advanced.powerLoad > 75} />
          <MetricChip label="Радиация"  val={fmt(metrics.advanced.radiation, 2)}      unit=" μSv"  danger={metrics.advanced.radiation > 0.23} />
          <MetricChip label="Сейсмика"  val={fmt(metrics.seismic.maxQuakeMag, 1)}     unit=" Mag"  danger={metrics.seismic.maxQuakeMag > 4.5} warn={metrics.seismic.maxQuakeMag > 3} />
          <MetricChip label="Инциденты" val={metrics.incidents.length}                unit=""      danger={metrics.incidents.length > 8} warn={metrics.incidents.length > 3} />
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16, borderLeft: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: isCrisis ? '#ef4444' : '#10b981', boxShadow: `0 0 8px ${isCrisis ? '#ef4444' : '#10b981'}` }} />
            <div style={{ fontSize: 11, fontWeight: 800, color: isCrisis ? '#ef4444' : '#10b981' }}>
              {isCrisis ? 'КАТАСТРОФА' : 'НОРМА'}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {aiChatHistory.length === 0 && (
            <div style={{ textAlign: 'center', margin: 'auto', opacity: 0.4 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>Начните диалог с ИИ-советником</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Используйте быстрые вопросы выше или задайте свой</div>
            </div>
          )}
          {aiChatHistory.map((msg, i) => (
            <ChatMessage key={i} msg={msg} isLast={i === aiChatHistory.length - 1} />
          ))}
          {isAiThinking && (
            <div style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', maxWidth: '84%' }}>
              <div style={{ fontSize: 9, color: 'var(--color-primary)', fontWeight: 800, letterSpacing: '1.2px', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
                🤖 LLAMA3 · НЕЙРОСОВЕТНИК
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderLeft: '3px solid var(--color-primary)',
                padding: '12px 16px', borderRadius: '4px 16px 16px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--color-primary)',
                      animation: `dot-bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Генерирую анализ на основе живых данных города...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.4)', flexShrink: 0,
        }}>
          <form onSubmit={onSend} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(e); } }}
                placeholder="Задайте вопрос ИИ-советнику Акимата... (Enter — отправить, Shift+Enter — новая строка)"
                rows={2}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)', color: 'var(--text-bright)',
                  padding: '12px 16px', borderRadius: 14, outline: 'none', fontSize: 13,
                  resize: 'none', fontFamily: 'inherit', lineHeight: 1.6, transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)'; }}
                onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <button
              type="submit"
              disabled={isAiThinking || !inputVal.trim()}
              style={{
                background: (isAiThinking || !inputVal.trim())
                  ? 'rgba(255,255,255,0.06)'
                  : 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                color: (isAiThinking || !inputVal.trim()) ? 'var(--text-muted)' : '#fff',
                border: 'none', padding: '0 22px', height: 50, borderRadius: 14,
                fontWeight: 800, cursor: (isAiThinking || !inputVal.trim()) ? 'not-allowed' : 'pointer',
                fontSize: 14, transition: 'all 0.25s', whiteSpace: 'nowrap',
                boxShadow: (!isAiThinking && inputVal.trim()) ? '0 4px 20px rgba(99,102,241,0.35)' : 'none',
              }}
            >
              {isAiThinking ? '⌛' : '↑ SEND'}
            </button>
          </form>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', marginTop: 8 }}>
            💡 Enter — отправить · Shift+Enter — новая строка · Alt+4 — ИИ Лаборатория
          </div>
        </div>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes orb-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes orb-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orb-ring {
          0%   { transform: scale(1);    opacity: 0.8; }
          50%  { transform: scale(1.3);  opacity: 0; }
          100% { transform: scale(1.3);  opacity: 0; }
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AIAnalyst;
