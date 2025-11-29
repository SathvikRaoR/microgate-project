import { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

/**
 * ActivityLog Component - Real-time Activity Monitor
 * Displays system logs with timestamps matching dashboard theme
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
        ? 'rgba(30, 41, 59, 0.7)'
        : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(20px)',
      border: theme === 'dark' ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid rgba(59, 130, 246, 0.2)',
      borderRadius: '21px',
      padding: '34px',
      height: '400px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: theme === 'dark'
        ? '0 8px 32px rgba(0, 0, 0, 0.4)'
        : '0 8px 32px rgba(0, 0, 0, 0.1)',
      fontFamily: "'Courier New', monospace",
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '13px',
        marginBottom: '21px',
        paddingBottom: '21px',
        borderBottom: theme === 'dark' ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid rgba(59, 130, 246, 0.2)'
      }}>
        <Terminal 
          size={21} 
          style={{ 
            color: theme === 'dark' ? '#a78bfa' : '#3b82f6',
            animation: 'pulse 2s ease-in-out infinite'
          }} 
        />
        <h3 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: '600',
          color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
          letterSpacing: '0px'
        }}>
          Activity Monitor
        </h3>
        <div style={{
          marginLeft: 'auto',
          fontSize: '12px',
          color: theme === 'dark' ? '#cbd5e1' : '#64748b',
          opacity: 0.8,
          fontWeight: '500'
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
            ? 'rgba(139, 92, 246, 0.5) transparent' 
            : 'rgba(59, 130, 246, 0.5) transparent'
        }}
      >
        {logs.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme === 'dark' ? '#cbd5e1' : '#64748b',
            opacity: 0.6,
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <span style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
              Awaiting activity...
            </span>
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              style={{
                marginBottom: '13px',
                fontSize: '13px',
                lineHeight: '1.6',
                opacity: 0.9,
                animation: 'fadeIn 0.3s ease-in',
                display: 'flex',
                gap: '10px'
              }}
            >
              <span style={{
                color: theme === 'dark' ? '#a78bfa' : '#3b82f6',
                fontWeight: '600',
                minWidth: '70px',
                flexShrink: 0
              }}>
                [{log.timestamp || formatTimestamp()}]
              </span>
              <span style={{
                color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
                wordBreak: 'break-word'
              }}>
                {log.message || log}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Inline Styles for Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 0.9;
            transform: translateY(0);
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
          width: 8px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background: ${theme === 'dark' ? 'rgba(139, 92, 246, 0.5)' : 'rgba(59, 130, 246, 0.5)'};
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: ${theme === 'dark' ? 'rgba(139, 92, 246, 0.8)' : 'rgba(59, 130, 246, 0.8)'};
        }
      `}</style>
    </div>
  );
}
