import { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

/**
 * ActivityLog Component - Cyberpunk Terminal Style Audit Trail
 * Displays real-time logs with timestamps in a Matrix-style interface
 */
export default function ActivityLog({ logs = [], theme = 'dark' }) {
  const logContainerRef = useRef(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTimestamp = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  };

  return (
    <div style={{
      background: theme === 'dark' 
        ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)'
        : 'linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%)',
      border: theme === 'dark' ? '2px solid #00ff41' : '2px solid #22c55e',
      borderRadius: '13px',
      padding: '21px',
      height: '400px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: theme === 'dark'
        ? '0 0 30px rgba(0, 255, 65, 0.3), inset 0 0 20px rgba(0, 255, 65, 0.1)'
        : '0 4px 20px rgba(0, 0, 0, 0.1)',
      fontFamily: "'Courier New', monospace",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '15px',
        paddingBottom: '15px',
        borderBottom: theme === 'dark' ? '1px solid #00ff41' : '1px solid #22c55e'
      }}>
        <Terminal 
          size={20} 
          style={{ 
            color: theme === 'dark' ? '#00ff41' : '#22c55e',
            animation: 'pulse 2s ease-in-out infinite'
          }} 
        />
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 'bold',
          color: theme === 'dark' ? '#00ff41' : '#16a34a',
          letterSpacing: '1px',
          textTransform: 'uppercase'
        }}>
          Activity Monitor
        </h3>
        <div style={{
          marginLeft: 'auto',
          fontSize: '10px',
          color: theme === 'dark' ? '#00ff41' : '#16a34a',
          opacity: 0.7
        }}>
          {logs.length} EVENTS
        </div>
      </div>

      {/* Log Container */}
      <div
        ref={logContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: '10px',
          scrollbarWidth: 'thin',
          scrollbarColor: theme === 'dark' 
            ? '#00ff41 #1a1a1a' 
            : '#22c55e #e5e5e5'
        }}
      >
        {logs.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme === 'dark' ? '#00ff41' : '#22c55e',
            opacity: 0.5,
            fontSize: '14px'
          }}>
            <span style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
              ▮ AWAITING SYSTEM ACTIVITY...
            </span>
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              style={{
                marginBottom: '8px',
                fontSize: '13px',
                lineHeight: '1.6',
                color: theme === 'dark' ? '#00ff41' : '#16a34a',
                opacity: 0.9,
                animation: 'fadeIn 0.3s ease-in',
                display: 'flex',
                gap: '10px'
              }}
            >
              <span style={{
                color: theme === 'dark' ? '#00cc33' : '#15803d',
                fontWeight: 'bold',
                minWidth: '70px'
              }}>
                [{log.timestamp || formatTimestamp()}]
              </span>
              <span style={{
                color: theme === 'dark' ? '#00ff41' : '#22c55e',
                wordBreak: 'break-word'
              }}>
                {log.message || log}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Scanline Effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: theme === 'dark'
          ? 'repeating-linear-gradient(0deg, rgba(0, 255, 65, 0.03) 0px, rgba(0, 255, 65, 0.03) 1px, transparent 1px, transparent 2px)'
          : 'repeating-linear-gradient(0deg, rgba(34, 197, 94, 0.02) 0px, rgba(34, 197, 94, 0.02) 1px, transparent 1px, transparent 2px)',
        pointerEvents: 'none'
      }} />

      {/* Inline Styles for Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 0.9;
            transform: translateX(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        /* Custom Scrollbar */
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: ${theme === 'dark' ? '#1a1a1a' : '#e5e5e5'};
        }
        div::-webkit-scrollbar-thumb {
          background: ${theme === 'dark' ? '#00ff41' : '#22c55e'};
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: ${theme === 'dark' ? '#00cc33' : '#16a34a'};
        }
      `}</style>
    </div>
  );
}
