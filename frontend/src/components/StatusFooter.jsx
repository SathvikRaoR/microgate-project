import { useState, useEffect } from 'react';
import { Activity, Database, Shield, Zap } from 'lucide-react';

/**
 * StatusFooter Component - System Health Monitor
 * Displays real-time system status with latency monitoring
 */
export default function StatusFooter({ backendUrl, theme = 'dark' }) {
  const [status, setStatus] = useState({
    rpcLatency: null,
    dbStatus: 'checking',
    lastCheck: null,
    isOnline: false
  });

  const checkHealth = async () => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${backendUrl}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        setStatus({
          rpcLatency: latency,
          dbStatus: 'connected',
          lastCheck: new Date(),
          isOnline: true,
          serverTime: data.timestamp
        });
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        rpcLatency: null,
        dbStatus: 'disconnected',
        lastCheck: new Date(),
        isOnline: false
      }));
    }
  };

  useEffect(() => {
    // Initial check
    checkHealth();
    
    // Check every 10 seconds
    const interval = setInterval(checkHealth, 10000);
    
    return () => clearInterval(interval);
  }, [backendUrl]);

  const getLatencyColor = (latency) => {
    if (!latency) return theme === 'dark' ? '#ef4444' : '#dc2626';
    if (latency < 200) return theme === 'dark' ? '#22c55e' : '#16a34a';
    if (latency < 500) return theme === 'dark' ? '#eab308' : '#ca8a04';
    return theme === 'dark' ? '#f97316' : '#ea580c';
  };

  const getLatencyIcon = (latency) => {
    if (!latency) return '🔴';
    if (latency < 200) return '🟢';
    if (latency < 500) return '🟡';
    return '🟠';
  };

  const formatLastCheck = () => {
    if (!status.lastCheck) return 'Never';
    const seconds = Math.floor((Date.now() - status.lastCheck.getTime()) / 1000);
    return `${seconds}s ago`;
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: theme === 'dark'
        ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.95) 100%)'
        : 'linear-gradient(135deg, rgba(241, 245, 249, 0.95) 0%, rgba(226, 232, 240, 0.95) 100%)',
      backdropFilter: 'blur(10px)',
      borderTop: theme === 'dark' 
        ? '1px solid rgba(124, 58, 237, 0.3)' 
        : '1px solid rgba(59, 130, 246, 0.3)',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '15px',
      zIndex: 1000,
      fontSize: '13px',
      fontFamily: "'Courier New', monospace",
      boxShadow: theme === 'dark'
        ? '0 -4px 20px rgba(0, 0, 0, 0.3)'
        : '0 -4px 20px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Status Items */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        {/* RPC Latency */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: theme === 'dark' 
            ? 'rgba(0, 0, 0, 0.3)' 
            : 'rgba(255, 255, 255, 0.5)',
          borderRadius: '8px',
          border: `1px solid ${getLatencyColor(status.rpcLatency)}33`
        }}>
          <Zap 
            size={16} 
            style={{ 
              color: getLatencyColor(status.rpcLatency),
              animation: status.isOnline ? 'pulse 2s ease-in-out infinite' : 'none'
            }} 
          />
          <span style={{
            color: theme === 'dark' ? '#e2e8f0' : '#334155',
            fontWeight: '600'
          }}>
            RPC Latency:
          </span>
          <span style={{
            color: getLatencyColor(status.rpcLatency),
            fontWeight: 'bold',
            minWidth: '50px'
          }}>
            {status.rpcLatency ? `${status.rpcLatency}ms` : '---'}
          </span>
          <span>{getLatencyIcon(status.rpcLatency)}</span>
        </div>

        {/* Database Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: theme === 'dark' 
            ? 'rgba(0, 0, 0, 0.3)' 
            : 'rgba(255, 255, 255, 0.5)',
          borderRadius: '8px',
          border: status.dbStatus === 'connected'
            ? `1px solid ${theme === 'dark' ? '#22c55e' : '#16a34a'}33`
            : `1px solid ${theme === 'dark' ? '#ef4444' : '#dc2626'}33`
        }}>
          <Database 
            size={16} 
            style={{ 
              color: status.dbStatus === 'connected' 
                ? (theme === 'dark' ? '#22c55e' : '#16a34a')
                : (theme === 'dark' ? '#ef4444' : '#dc2626')
            }} 
          />
          <span style={{
            color: theme === 'dark' ? '#e2e8f0' : '#334155',
            fontWeight: '600'
          }}>
            Database:
          </span>
          <span style={{
            color: status.dbStatus === 'connected'
              ? (theme === 'dark' ? '#22c55e' : '#16a34a')
              : (theme === 'dark' ? '#ef4444' : '#dc2626'),
            fontWeight: 'bold',
            textTransform: 'capitalize'
          }}>
            {status.dbStatus}
          </span>
          <span>{status.dbStatus === 'connected' ? '🟢' : '🔴'}</span>
        </div>

        {/* Compliance Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: theme === 'dark'
            ? 'rgba(34, 197, 94, 0.1)'
            : 'rgba(34, 197, 94, 0.15)',
          borderRadius: '8px',
          border: `1px solid ${theme === 'dark' ? '#22c55e' : '#16a34a'}33`
        }}>
          <Shield 
            size={16} 
            style={{ color: theme === 'dark' ? '#22c55e' : '#16a34a' }} 
          />
          <span style={{
            color: theme === 'dark' ? '#86efac' : '#16a34a',
            fontWeight: '600',
            fontSize: '12px'
          }}>
            Compliance: UK FCA Registered (Transak)
          </span>
        </div>
      </div>

      {/* Right Side - System Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        fontSize: '11px',
        color: theme === 'dark' ? '#94a3b8' : '#64748b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Activity size={14} />
          <span>Last check: {formatLastCheck()}</span>
        </div>
        <div style={{
          padding: '4px 10px',
          background: theme === 'dark'
            ? 'rgba(124, 58, 237, 0.2)'
            : 'rgba(59, 130, 246, 0.2)',
          borderRadius: '6px',
          color: theme === 'dark' ? '#c4b5fd' : '#3b82f6',
          fontWeight: 'bold',
          fontSize: '10px',
          letterSpacing: '0.5px'
        }}>
          BASE SEPOLIA
        </div>
      </div>

      {/* Inline Styles for Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
