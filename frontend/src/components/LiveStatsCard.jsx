import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Zap, Users, Clock, Coins } from 'lucide-react';

/**
 * LiveStatsCard - Business Metrics Dashboard
 * Answers Q16, Q18: "What's the ROI? How much money saved vs Stripe?"
 */
export default function LiveStatsCard({ theme = 'dark', backendUrl }) {
  const [metrics, setMetrics] = useState({
    total_api_calls: 0,
    unique_agents: 0,
    successful_calls: 0,
    total_volume_eth: 0,
    avg_latency_ms: 0,
    stripe_equivalent_cost_usd: 0,
    microgate_cost_usd: 0,
    total_savings_usd: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [backendUrl]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/metrics`);
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.metrics);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(num || 0);
  };

  const formatETH = (num) => {
    return parseFloat(num || 0).toFixed(6);
  };

  const stats = [
    {
      icon: Zap,
      label: 'Total API Calls',
      value: formatNumber(metrics.total_api_calls),
      color: theme === 'dark' ? '#a78bfa' : '#3b82f6',
      bgColor: theme === 'dark' ? 'rgba(124, 58, 237, 0.1)' : 'rgba(59, 130, 246, 0.1)'
    },
    {
      icon: Users,
      label: 'Unique Agents',
      value: formatNumber(metrics.unique_agents),
      color: theme === 'dark' ? '#22c55e' : '#16a34a',
      bgColor: theme === 'dark' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)'
    },
    {
      icon: Coins,
      label: 'Total Volume',
      value: formatETH(metrics.total_volume_eth) + ' ETH',
      color: theme === 'dark' ? '#f59e0b' : '#d97706',
      bgColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.1)'
    },
    {
      icon: Clock,
      label: 'Avg Latency',
      value: (metrics.avg_latency_ms || 0) + 'ms',
      color: theme === 'dark' ? '#06b6d4' : '#0891b2',
      bgColor: theme === 'dark' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(6, 182, 212, 0.1)'
    }
  ];

  const savingsPercent = metrics.stripe_equivalent_cost_usd > 0
    ? ((metrics.total_savings_usd / metrics.stripe_equivalent_cost_usd) * 100).toFixed(1)
    : 0;

  return (
    <div style={{
      background: theme === 'dark' 
        ? 'rgba(30, 41, 59, 0.7)'
        : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(20px)',
      border: theme === 'dark' ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid rgba(59, 130, 246, 0.2)',
      borderRadius: '21px',
      padding: '34px',
      boxShadow: theme === 'dark'
        ? '0 8px 32px rgba(0, 0, 0, 0.4)'
        : '0 8px 32px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '21px',
        paddingBottom: '21px',
        borderBottom: theme === 'dark' ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid rgba(59, 130, 246, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
          <TrendingUp 
            size={24} 
            style={{ 
              color: theme === 'dark' ? '#a78bfa' : '#3b82f6'
            }} 
          />
          <h3 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '600',
            color: theme === 'dark' ? '#f1f5f9' : '#1e293b'
          }}>
            Live Business Metrics
          </h3>
        </div>
        <button
          onClick={fetchMetrics}
          style={{
            padding: '8px 13px',
            background: 'transparent',
            border: `1px solid ${theme === 'dark' ? 'rgba(124, 58, 237, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
            borderRadius: '8px',
            color: theme === 'dark' ? '#a78bfa' : '#3b82f6',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = theme === 'dark' ? 'rgba(124, 58, 237, 0.1)' : 'rgba(59, 130, 246, 0.1)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'transparent';
          }}
        >
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '13px',
        marginBottom: '21px'
      }}>
        {stats.map((stat, index) => (
          <div key={index} style={{
            padding: '21px',
            background: stat.bgColor,
            borderRadius: '13px',
            border: `1px solid ${stat.color}20`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <stat.icon size={20} style={{ color: stat.color, marginRight: '8px' }} />
              <div style={{
                fontSize: '12px',
                color: theme === 'dark' ? '#cbd5e1' : '#64748b',
                fontWeight: '500'
              }}>
                {stat.label}
              </div>
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: theme === 'dark' ? '#f1f5f9' : '#1e293b'
            }}>
              {loading ? '...' : stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Cost Comparison - The "Wow" Factor */}
      <div style={{
        background: theme === 'dark'
          ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.08) 100%)',
        border: `2px solid ${theme === 'dark' ? '#22c55e' : '#16a34a'}`,
        borderRadius: '13px',
        padding: '21px',
        marginTop: '13px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '13px'
        }}>
          <DollarSign size={24} style={{ color: '#22c55e', marginRight: '8px' }} />
          <h4 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: theme === 'dark' ? '#86efac' : '#16a34a'
          }}>
            💰 Money Saved vs Stripe
          </h4>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '13px',
          marginBottom: '13px'
        }}>
          <div>
            <div style={{
              fontSize: '11px',
              color: theme === 'dark' ? '#cbd5e1' : '#64748b',
              marginBottom: '4px',
              fontWeight: '500'
            }}>
              Stripe Would Cost
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#ef4444'
            }}>
              {loading ? '...' : formatCurrency(metrics.stripe_equivalent_cost_usd)}
            </div>
          </div>

          <div>
            <div style={{
              fontSize: '11px',
              color: theme === 'dark' ? '#cbd5e1' : '#64748b',
              marginBottom: '4px',
              fontWeight: '500'
            }}>
              MicroGate Cost
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              color: theme === 'dark' ? '#22c55e' : '#16a34a'
            }}>
              {loading ? '...' : formatCurrency(metrics.microgate_cost_usd)}
            </div>
          </div>

          <div>
            <div style={{
              fontSize: '11px',
              color: theme === 'dark' ? '#cbd5e1' : '#64748b',
              marginBottom: '4px',
              fontWeight: '500'
            }}>
              Total Savings
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#22c55e'
            }}>
              {loading ? '...' : formatCurrency(metrics.total_savings_usd)}
            </div>
          </div>
        </div>

        {/* Savings Bar */}
        <div style={{
          background: theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)',
          borderRadius: '8px',
          height: '8px',
          overflow: 'hidden',
          marginBottom: '8px'
        }}>
          <div style={{
            background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
            height: '100%',
            width: `${Math.min(savingsPercent, 100)}%`,
            transition: 'width 0.5s ease',
            borderRadius: '8px'
          }} />
        </div>

        <div style={{
          fontSize: '13px',
          color: theme === 'dark' ? '#86efac' : '#16a34a',
          fontWeight: '600',
          textAlign: 'center'
        }}>
          🎉 Saving {savingsPercent}% on transaction fees
        </div>

        <div style={{
          marginTop: '13px',
          padding: '8px',
          background: theme === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)',
          borderRadius: '8px',
          fontSize: '11px',
          color: theme === 'dark' ? '#cbd5e1' : '#64748b',
          lineHeight: '1.5'
        }}>
          <strong>Calculation:</strong> Stripe charges 2.9% + $0.30 per transaction. 
          MicroGate only pays gas (~$0.01 on Base). This ROI compounds with volume.
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div style={{
          marginTop: '13px',
          padding: '13px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          color: '#ef4444',
          fontSize: '12px'
        }}>
          ⚠️ Failed to load metrics: {error}
        </div>
      )}
    </div>
  );
}
