import { useEffect, useRef, useState } from 'react';
import { Terminal, Shield, Database, Link, CheckCircle2, XCircle, Clock } from 'lucide-react';

/**
 * MatrixActivityLog - Visual Proof of Work
 * Shows backend verification steps in real-time
 * Answers Q15: "How do we know the system is working?"
 */
export default function MatrixActivityLog({ logs = [], theme = 'dark', verificationSteps = [] }) {
  const logContainerRef = useRef(null);
  const [activeStep, setActiveStep] = useState(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Update active step based on latest log
  useEffect(() => {
    if (logs.length > 0) {
      const latestLog = logs[logs.length - 1];
      const message = latestLog.message || latestLog;
      
      if (message.includes('Chain ID')) setActiveStep('chain');
      else if (message.includes('Replay')) setActiveStep('replay');
      else if (message.includes('Payment') || message.includes('Verified')) setActiveStep('payment');
      else if (message.includes('completed')) setActiveStep('complete');
    }
  }, [logs]);

  const getStepIcon = (step) => {
    const iconProps = {
      size: 18,
      style: { 
        color: theme === 'dark' ? '#a78bfa' : '#3b82f6',
        marginRight: '8px'
      }
    };

    switch (step) {
      case 'chain': return <Link {...iconProps} />;
      case 'replay': return <Shield {...iconProps} />;
      case 'payment': return <CheckCircle2 {...iconProps} />;
      case 'complete': return <Database {...iconProps} />;
      default: return <Clock {...iconProps} />;
    }
  };

  const verificationPipeline = [
    { id: 'chain', label: 'Chain ID Validation', status: activeStep === 'chain' ? 'active' : activeStep ? 'done' : 'pending' },
    { id: 'replay', label: 'Anti-Replay Check', status: activeStep === 'replay' ? 'active' : (activeStep === 'payment' || activeStep === 'complete') ? 'done' : 'pending' },
    { id: 'payment', label: 'Cryptographic Verify', status: activeStep === 'payment' ? 'active' : activeStep === 'complete' ? 'done' : 'pending' },
    { id: 'complete', label: 'Cache & Respond', status: activeStep === 'complete' ? 'active' : 'pending' }
  ];

  return (
    <div style={{
      background: theme === 'dark' 
        ? 'rgba(30, 41, 59, 0.7)'
        : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(20px)',
      border: theme === 'dark' ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid rgba(59, 130, 246, 0.2)',
      borderRadius: '21px',
      padding: '34px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: theme === 'dark'
        ? '0 8px 32px rgba(0, 0, 0, 0.4)'
        : '0 8px 32px rgba(0, 0, 0, 0.1)',
      fontFamily: "'Courier New', monospace",
      transition: 'all 0.3s ease',
      minHeight: '500px'
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
          size={24} 
          style={{ 
            color: theme === 'dark' ? '#a78bfa' : '#3b82f6',
            animation: 'pulse 2s ease-in-out infinite'
          }} 
        />
        <h3 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: '600',
          color: theme === 'dark' ? '#f1f5f9' : '#1e293b'
        }}>
          Security Pipeline
        </h3>
        <div style={{
          marginLeft: 'auto',
          fontSize: '12px',
          color: theme === 'dark' ? '#cbd5e1' : '#64748b',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: activeStep ? '#22c55e' : theme === 'dark' ? '#64748b' : '#94a3b8',
            animation: activeStep ? 'pulse 2s ease-in-out infinite' : 'none'
          }} />
          {activeStep ? 'PROCESSING' : 'IDLE'}
        </div>
      </div>

      {/* Verification Pipeline */}
      <div style={{
        marginBottom: '21px',
        padding: '13px',
        background: theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.6)',
        borderRadius: '13px'
      }}>
        <div style={{
          fontSize: '11px',
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: '600'
        }}>
          Backend Verification Steps
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {verificationPipeline.map((step, index) => (
            <div key={step.id} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
              borderRadius: '8px',
              background: step.status === 'active' 
                ? (theme === 'dark' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(59, 130, 246, 0.2)')
                : 'transparent',
              border: step.status === 'active'
                ? (theme === 'dark' ? '1px solid #7c3aed' : '1px solid #3b82f6')
                : '1px solid transparent',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '10px',
                background: step.status === 'done' 
                  ? '#22c55e'
                  : step.status === 'active'
                  ? (theme === 'dark' ? '#7c3aed' : '#3b82f6')
                  : (theme === 'dark' ? '#334155' : '#e2e8f0'),
                color: step.status === 'pending' 
                  ? (theme === 'dark' ? '#64748b' : '#94a3b8')
                  : '#ffffff',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {step.status === 'done' ? '✓' : index + 1}
              </div>
              <span style={{
                fontSize: '13px',
                color: step.status === 'pending'
                  ? (theme === 'dark' ? '#64748b' : '#94a3b8')
                  : (theme === 'dark' ? '#f1f5f9' : '#1e293b'),
                fontWeight: step.status === 'active' ? '600' : '400'
              }}>
                {step.label}
              </span>
              {step.status === 'active' && (
                <div style={{
                  marginLeft: 'auto',
                  width: '16px',
                  height: '16px',
                  border: `2px solid ${theme === 'dark' ? '#7c3aed' : '#3b82f6'}`,
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Activity Log Container */}
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
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: theme === 'dark' ? '#cbd5e1' : '#64748b',
            opacity: 0.6,
            textAlign: 'center'
          }}>
            <Terminal size={48} style={{ marginBottom: '13px', opacity: 0.5 }} />
            <div style={{ fontSize: '14px', fontWeight: '500' }}>
              Awaiting activity...
            </div>
            <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
              Click "Activate Agent" to start
            </div>
          </div>
        ) : (
          logs.map((log, index) => {
            const message = log.message || log;
            const isError = message.includes('❌') || message.includes('Error') || message.includes('failed');
            const isSuccess = message.includes('✅') || message.includes('success') || message.includes('completed');
            const isWarning = message.includes('⚠️') || message.includes('checking');
            
            return (
              <div
                key={index}
                style={{
                  marginBottom: '13px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  animation: 'slideInLeft 0.3s ease-out',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start'
                }}
              >
                <span style={{
                  color: isError 
                    ? '#ef4444' 
                    : isSuccess 
                    ? '#22c55e'
                    : isWarning
                    ? '#f59e0b'
                    : (theme === 'dark' ? '#a78bfa' : '#3b82f6'),
                  fontWeight: '600',
                  minWidth: '70px',
                  flexShrink: 0
                }}>
                  [{log.timestamp || new Date().toLocaleTimeString('en-US', { hour12: false })}]
                </span>
                <span style={{
                  color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
                  wordBreak: 'break-word',
                  flex: 1
                }}>
                  {message}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Inline Styles for Animations */}
      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
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

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
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
