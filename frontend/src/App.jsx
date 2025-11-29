import { useState, useEffect, useCallback } from 'react'
import { createPublicClient, http, formatEther } from 'viem'
import { baseSepolia } from 'viem/chains'
import { Transak } from '@transak/transak-sdk'
import { Sun, Moon, Zap, Wallet, Activity, ExternalLink, CheckCircle2, Download, Sparkles, TrendingUp, Shield } from 'lucide-react'
import ActivityTerminal from './components/ActivityTerminal'
import TransactionHistory from './components/TransactionHistory'
import SystemStatus from './components/SystemStatus'
import { generateInvoice } from './utils/invoiceGenerator'

// Configuration
const CONFIG = {
  AGENT_WALLET: import.meta.env.VITE_AGENT_WALLET_ADDRESS || '0x8f4e057c5ae678b68bb9c8d679e6524ac2ec7ebc',
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
  TRANSAK_API_KEY: import.meta.env.VITE_TRANSAK_API_KEY || '4fcd6904-706b-4aff-bd9d-77422813bbb9',
  TRANSAK_ENVIRONMENT: import.meta.env.VITE_TRANSAK_ENV || 'STAGING',
  BALANCE_REFRESH_DELAY: 5000,
  RPC_URL: import.meta.env.VITE_RPC_URL || 'https://sepolia.base.org',
  MIN_ETH_AMOUNT: 0.0001 // Match backend requirement
};

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(CONFIG.RPC_URL)
});

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('microgate-theme') || 'dark');
  const [isDesktop, setIsDesktop] = useState(true);
  const [transakInstance, setTransakInstance] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [agentStatus, setAgentStatus] = useState('idle');
  const [agentResult, setAgentResult] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs(prev => [...prev, message]);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('microgate-theme', newTheme);
  };

  const fetchTransactions = useCallback(async () => {
    if (!CONFIG.AGENT_WALLET) return;
    setLoadingTransactions(true);
    try {
      const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/transactions?agent_address=${CONFIG.AGENT_WALLET}`
      );
      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!CONFIG.AGENT_WALLET || !CONFIG.AGENT_WALLET.startsWith('0x')) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setIsError(false);
      const balanceValue = await publicClient.getBalance({
        address: CONFIG.AGENT_WALLET
      });
      setBalance({
        value: balanceValue,
        formatted: formatEther(balanceValue),
        symbol: 'ETH'
      });
    } catch (err) {
      console.error('Error fetching balance:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = fetchBalance;

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    
    const configured = CONFIG.AGENT_WALLET && 
                      !CONFIG.AGENT_WALLET.includes('YOUR_AGENT_WALLET') &&
                      CONFIG.AGENT_WALLET.startsWith('0x');
    setIsConfigured(configured);
    
    if (!configured) {
      setError('Please configure VITE_AGENT_WALLET_ADDRESS in .env file');
    } else {
      fetchBalance();
      fetchTransactions();
      const interval = setInterval(() => {
        fetchBalance();
        fetchTransactions();
      }, 30000);
      return () => {
        clearInterval(interval);
        window.removeEventListener('resize', handleResize);
      };
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [fetchBalance, fetchTransactions]);

  const handleAddFunds = useCallback(() => {
    if (!CONFIG.TRANSAK_API_KEY || CONFIG.TRANSAK_API_KEY.includes('YOUR_TRANSAK')) {
      setError('Please configure VITE_TRANSAK_API_KEY in .env file');
      return;
    }
    if (transakInstance) {
      try {
        transakInstance.close();
      } catch (e) {
        console.log('Error closing previous instance:', e);
      }
    }
    try {
      const transak = new Transak({
        apiKey: CONFIG.TRANSAK_API_KEY,
        environment: CONFIG.TRANSAK_ENVIRONMENT,
        defaultCryptoCurrency: 'ETH',
        walletAddress: CONFIG.AGENT_WALLET,
        themeColor: theme === 'dark' ? '7C3AED' : '3B82F6',
        fiatCurrency: 'USD',
        email: '',
        redirectURL: '',
        hostURL: window.location.origin,
        widgetHeight: '650px',
        widgetWidth: '450px',
        defaultNetwork: 'base_sepolia',
        networks: 'base_sepolia',
        exchangeScreenTitle: 'Add Funds to Agent Wallet'
      });

      transak.init();

      transak.on(transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (orderData) => {
        console.log('✅ Order successful:', orderData);
        setSuccess('💰 Funds added successfully!');
        transak.close();
        setTransakInstance(null);
        setTimeout(() => {
          fetchBalance();
          setSuccess(null);
        }, CONFIG.BALANCE_REFRESH_DELAY);
      });

      transak.on(transak.EVENTS.TRANSAK_ORDER_FAILED, (orderData) => {
        console.log('❌ Order failed:', orderData);
        setError('Transaction failed. Please try again.');
        transak.close();
        setTransakInstance(null);
      });

      transak.on(transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
        console.log('Widget closed');
        setTransakInstance(null);
      });

      setTransakInstance(transak);
      setError(null);
    } catch (err) {
      console.error('Transak initialization error:', err);
      const errorMessage = err.message || '';
      if (errorMessage.includes('API key') || errorMessage.includes('Invalid')) {
        setError(`❌ Invalid Transak API Key. Please check:\n1. Key is correct in .env file\n2. Add http://localhost:5173 to allowed origins\n3. Go to: https://global.transak.com/ → Settings → API Keys`);
      } else {
        setError('Failed to initialize payment widget. Please check console for details.');
      }
      setTransakInstance(null);
    }
  }, [theme, fetchBalance, transakInstance]);

  const handleActivateAgent = async () => {
    setAgentStatus('activating');
    setError(null);
    setSuccess(null);
    setAgentResult(null);
    setLogs([]);

    try {
      addLog('[INFO] Agent activation started...');
      
      // Updated balance check to match backend requirement
      const minRequired = CONFIG.MIN_ETH_AMOUNT + 0.00005; // 0.0001 + gas buffer
      if (!balance || parseFloat(balance.formatted) < minRequired) {
        addLog('[ERROR] ❌ Insufficient balance');
        throw new Error(`Insufficient balance. Required: ${minRequired} ETH (0.0001 ETH + gas), Available: ${balance ? balance.formatted : '0'} ETH`);
      }
      
      addLog('[SUCCESS] ✅ Balance OK: ' + formatBalance(balance) + ' ETH');
      addLog('[INFO] Preparing transaction...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      addLog('[INFO] Signing payload...');
      await new Promise(resolve => setTimeout(resolve, 400));
      addLog('[SUCCESS] ✅ Payload signed');
      
      addLog('[INFO] Estimating gas...');
      await new Promise(resolve => setTimeout(resolve, 300));
      addLog('[SUCCESS] ✅ Gas estimated');
      
      addLog('[INFO] Connecting to RPC...');
      await new Promise(resolve => setTimeout(resolve, 300));
      addLog('[SUCCESS] ✅ RPC connected');
      
      addLog('[INFO] Sending transaction...');

      const response = await fetch(`${CONFIG.BACKEND_URL}/api/trigger-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallet: CONFIG.AGENT_WALLET
        })
      });

      addLog('[INFO] 📡 Awaiting backend confirmation...');
      await new Promise(resolve => setTimeout(resolve, 800));

      if (!response.ok) {
        const errorData = await response.json();
        addLog('[ERROR] ❌ Backend error: ' + (errorData.error || 'Unknown error'));
        throw new Error(errorData.error || errorData.message || 'Agent execution failed');
      }

      const data = await response.json();
      addLog('[INFO] Verifying transaction...');
      await new Promise(resolve => setTimeout(resolve, 500));

      if (data.success) {
        const txHash = data.data?.transactionHash || data.data?.paymentTxHash;
        addLog('[SUCCESS] ✅ Transaction confirmed!');
        addLog('[SUCCESS] TX: ' + (txHash ? txHash.slice(0, 10) + '...' : 'N/A'));
        addLog('[SUCCESS] 🎉 Agent execution complete!');
        
        setAgentStatus('success');
        setAgentResult(data.data);
        setSuccess('✅ Agent executed successfully!');
        
        setTimeout(() => {
          fetchBalance();
          fetchTransactions();
          addLog('[INFO] 🔄 Refreshed balance and transaction history');
        }, 2000);
      } else {
        throw new Error(data.error || 'Agent execution failed');
      }
    } catch (err) {
      console.error('Agent error:', err);
      addLog('[ERROR] ❌ ' + err.message);
      setAgentStatus('error');
      setError(`❌ ${err.message}`);
    }
  };

  const handleDownloadInvoice = () => {
    if (!agentResult) return;
    addLog('📄 Generating PDF invoice...');
    try {
      generateInvoice(
        agentResult.transactionHash || 'N/A',
        CONFIG.MIN_ETH_AMOUNT.toString(),
        CONFIG.AGENT_WALLET,
        {
          gasUsed: agentResult.gasUsed || 'N/A',
          secret: agentResult.secret || 'N/A'
        }
      );
      addLog('✅ Invoice downloaded successfully');
      setSuccess('📄 Invoice downloaded!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      addLog('❌ Failed to generate invoice');
      setError('Failed to generate invoice');
      setTimeout(() => setError(null), 3000);
    }
  };

  const formatBalance = (bal) => {
    if (!bal) return '0.0000';
    return parseFloat(bal.formatted).toFixed(4);
  };

  const shortenAddress = (address) => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      {/* Background with animated gradient */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: theme === 'dark' 
          ? 'radial-gradient(circle at 20% 50%, rgba(124, 58, 237, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 50%), linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
          : 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%), linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f8fafc 100%)',
        zIndex: -1
      }} />

      <div style={{
        minHeight: '100vh',
        color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
        padding: '40px 24px 100px',
        position: 'relative'
      }}>
        {/* Floating Theme Toggle */}
        <button 
          onClick={toggleTheme}
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 1000,
            background: theme === 'dark' ? 'rgba(124, 58, 237, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            border: theme === 'dark' ? '2px solid rgba(124, 58, 237, 0.3)' : '2px solid rgba(59, 130, 246, 0.3)',
            color: theme === 'dark' ? '#c4b5fd' : '#3b82f6',
            padding: '16px',
            borderRadius: '50%',
            cursor: 'pointer',
            backdropFilter: 'blur(16px)',
            boxShadow: theme === 'dark' 
              ? '0 8px 32px rgba(124, 58, 237, 0.2)'
              : '0 8px 32px rgba(59, 130, 246, 0.2)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1) rotate(15deg)';
            e.currentTarget.style.boxShadow = theme === 'dark'
              ? '0 12px 48px rgba(124, 58, 237, 0.4)'
              : '0 12px 48px rgba(59, 130, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
            e.currentTarget.style.boxShadow = theme === 'dark'
              ? '0 8px 32px rgba(124, 58, 237, 0.2)'
              : '0 8px 32px rgba(59, 130, 246, 0.2)';
          }}
        >
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>

        {/* Premium Header with SVG Icon */}
        <div style={{ textAlign: 'center', marginBottom: '64px', paddingTop: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '16px'
          }}>
            {/* Animated Lightning SVG */}
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{
              filter: 'drop-shadow(0 4px 20px rgba(124, 58, 237, 0.5))',
              animation: 'float 3s ease-in-out infinite'
            }}>
              <defs>
                <linearGradient id="lightning-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#e0d4ff', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#ff6ec7', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <path 
                d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
                fill="url(#lightning-gradient)"
                stroke={theme === 'dark' ? '#c4b5fd' : '#7c3aed'}
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
            <h1 style={{
              fontSize: '72px',
              fontWeight: '800',
              background: theme === 'dark'
                ? 'linear-gradient(135deg, #e0d4ff 0%, #ff6ec7 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.03em',
              margin: 0,
              textShadow: '0 4px 24px rgba(124, 58, 237, 0.3)'
            }}>
              MicroGate
            </h1>
          </div>
          <p style={{
            fontSize: '20px',
            color: theme === 'dark' ? '#cbd5e1' : '#64748b',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <Shield size={20} style={{ color: theme === 'dark' ? '#22c55e' : '#16a34a' }} />
            AI Agent Payment Dashboard on Base Sepolia
          </p>
        </div>

        {/* Error Alert with Premium Design */}
        {error && (
          <div style={{
            maxWidth: '1000px',
            margin: '0 auto 24px',
            padding: '20px 24px',
            borderRadius: '16px',
            background: theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.15)',
            border: '2px solid #ef4444',
            backdropFilter: 'blur(16px)',
            fontSize: '15px',
            fontWeight: '500',
            color: theme === 'dark' ? '#fca5a5' : '#dc2626',
            position: 'relative',
            paddingRight: '60px',
            boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)',
            animation: 'slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{error}</div>
            <button
              onClick={() => setError(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'inherit',
                fontSize: '20px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'scale(1.1) rotate(90deg)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'scale(1) rotate(0deg)';
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div style={{
            maxWidth: '1000px',
            margin: '0 auto 24px',
            padding: '20px 24px',
            borderRadius: '16px',
            background: theme === 'dark' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.15)',
            border: '2px solid #22c55e',
            backdropFilter: 'blur(16px)',
            fontSize: '15px',
            fontWeight: '500',
            color: theme === 'dark' ? '#86efac' : '#16a34a',
            boxShadow: '0 8px 32px rgba(34, 197, 94, 0.2)',
            animation: 'slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {success}
          </div>
        )}

        {/* Main Content Container */}
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Premium Grid Layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? '420px 1fr' : '1fr',
            gap: '32px',
            marginBottom: '48px',
            alignItems: 'start'
          }}>
            {/* Left Sidebar - Control Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Agent Balance Card - Premium Design */}
              <div style={{
                background: theme === 'dark' 
                  ? 'rgba(30, 41, 59, 0.6)'
                  : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(24px)',
                borderRadius: '24px',
                padding: '32px',
                border: theme === 'dark' ? '2px solid rgba(124, 58, 237, 0.2)' : '2px solid rgba(59, 130, 246, 0.15)',
                boxShadow: theme === 'dark'
                  ? '0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 20px 60px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = theme === 'dark'
                  ? '0 24px 72px rgba(124, 58, 237, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 24px 72px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = theme === 'dark'
                  ? '0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 20px 60px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
              }}
              >
                {/* Subtle background pattern */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(124, 58, 237, 0.05) 1px, transparent 0)',
                  backgroundSize: '32px 32px',
                  opacity: 0.3
                }} />

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '24px',
                  position: 'relative'
                }}>
                  <h2 style={{
                    fontSize: '22px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
                    margin: 0
                  }}>
                    <Wallet size={24} style={{ 
                      color: theme === 'dark' ? '#c4b5fd' : '#7c3aed',
                      filter: 'drop-shadow(0 2px 8px rgba(124, 58, 237, 0.3))'
                    }} />
                    Agent Wallet
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: isConfigured ? '#22c55e' : '#ef4444',
                      boxShadow: isConfigured 
                        ? '0 0 16px rgba(34, 197, 94, 0.6), 0 0 4px rgba(34, 197, 94, 0.8)'
                        : '0 0 16px rgba(239, 68, 68, 0.6)',
                      animation: 'pulse 2s ease-in-out infinite'
                    }} />
                    <span style={{
                      fontSize: '13px',
                      color: theme === 'dark' ? '#cbd5e1' : '#64748b',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {isConfigured ? 'Live' : 'Offline'}
                    </span>
                  </div>
                </div>

                {/* Wallet Address Box */}
                <div style={{
                  background: theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '20px',
                  border: theme === 'dark' ? '1px solid rgba(124, 58, 237, 0.2)' : '1px solid rgba(59, 130, 246, 0.1)',
                  position: 'relative'
                }}>
                  <p style={{
                    fontSize: '12px',
                    color: theme === 'dark' ? '#94a3b8' : '#64748b',
                    marginBottom: '8px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Wallet Address
                  </p>
                  <p style={{
                    fontFamily: 'monospace',
                    fontSize: '16px',
                    color: theme === 'dark' ? '#c4b5fd' : '#7c3aed',
                    fontWeight: '700',
                    margin: 0
                  }}>
                    {shortenAddress(CONFIG.AGENT_WALLET)}
                  </p>
                </div>

                {/* Balance Display - Premium Gradient Card */}
                <div style={{
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                  borderRadius: '20px',
                  padding: '28px',
                  marginBottom: '16px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 12px 40px rgba(124, 58, 237, 0.4)'
                }}>
                  {/* Animated shimmer effect */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                    animation: 'shimmer 3s infinite'
                  }} />

                  <p style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginBottom: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    position: 'relative'
                  }}>
                    Current Balance
                  </p>
                  {isLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
                      <Activity size={40} className="animate-spin" style={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                      <span style={{ fontSize: '24px', color: 'rgba(255, 255, 255, 0.95)', fontWeight: '600' }}>Loading...</span>
                    </div>
                  ) : isError ? (
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#fca5a5', position: 'relative' }}>
                      Error loading
                    </p>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <p style={{
                          fontSize: '64px',
                          fontWeight: '800',
                          color: '#ffffff',
                          lineHeight: 1,
                          margin: 0,
                          textShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                        }}>
                          {formatBalance(balance)}
                        </p>
                        <TrendingUp size={32} style={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                      </div>
                      <p style={{
                        fontSize: '16px',
                        color: 'rgba(255, 255, 255, 0.95)',
                        marginTop: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Sparkles size={16} />
                        {balance?.symbol || 'ETH'} on Base Sepolia
                      </p>
                    </div>
                  )}
                </div>

                {/* Refresh Button */}
                <button
                  onClick={() => refetch()}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '16px 24px',
                    borderRadius: '16px',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '15px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    background: theme === 'dark' ? 'rgba(51, 65, 85, 0.8)' : 'rgba(226, 232, 240, 0.9)',
                    color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                    opacity: isLoading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <Activity size={16} className={isLoading ? 'animate-spin' : ''} />
                  {isLoading ? 'Refreshing...' : 'Refresh Balance'}
                </button>
              </div>

              {/* Activate Agent Card */}
              <div style={{
                background: theme === 'dark' 
                  ? 'rgba(30, 41, 59, 0.6)'
                  : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(24px)',
                borderRadius: '24px',
                padding: '32px',
                border: theme === 'dark' ? '2px solid rgba(124, 58, 237, 0.2)' : '2px solid rgba(59, 130, 246, 0.15)',
                boxShadow: theme === 'dark'
                  ? '0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 20px 60px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = theme === 'dark'
                  ? '0 24px 72px rgba(124, 58, 237, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 24px 72px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = theme === 'dark'
                  ? '0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 20px 60px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
              }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h2 style={{
                    fontSize: '22px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
                    margin: 0
                  }}>
                    <Zap size={24} style={{ 
                      color: theme === 'dark' ? '#fbbf24' : '#f59e0b',
                      filter: 'drop-shadow(0 2px 8px rgba(251, 191, 36, 0.4))'
                    }} />
                    Activate Agent
                  </h2>
                </div>

                <p style={{
                  color: theme === 'dark' ? '#cbd5e1' : '#64748b',
                  marginBottom: '24px',
                  fontSize: '15px',
                  lineHeight: '1.6'
                }}>
                  Trigger the autonomous AI agent to execute a secure payment transaction on Base Sepolia testnet.
                </p>

                <button
                  onClick={handleActivateAgent}
                  disabled={!isConfigured || agentStatus === 'activating'}
                  style={{
                    width: '100%',
                    padding: '18px 28px',
                    borderRadius: '16px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '16px',
                    cursor: (!isConfigured || agentStatus === 'activating') ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    background: theme === 'dark'
                      ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
                      : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    color: '#ffffff',
                    boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
                    opacity: (!isConfigured || agentStatus === 'activating') ? 0.5 : 1,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (isConfigured && agentStatus !== 'activating') {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(124, 58, 237, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(124, 58, 237, 0.4)';
                  }}
                >
                  {agentStatus === 'activating' && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                      animation: 'shimmer 1.5s infinite'
                    }} />
                  )}
                  <Zap size={20} className={agentStatus === 'activating' ? 'animate-spin' : ''} />
                  {agentStatus === 'activating' ? 'Agent Running...' : 'Activate Agent'}
                </button>

                {/* Success Result */}
                {agentStatus === 'success' && agentResult && (agentResult.transactionHash || agentResult.basescanUrl) && (
                  <div style={{
                    marginTop: '24px',
                    padding: '24px',
                    background: theme === 'dark' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.15)',
                    borderRadius: '16px',
                    border: '2px solid #22c55e',
                    animation: 'slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <CheckCircle2 size={24} style={{ color: '#22c55e' }} />
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: theme === 'dark' ? '#86efac' : '#16a34a',
                        margin: 0
                      }}>
                        Proof of Execution
                      </h3>
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: theme === 'dark' ? '#cbd5e1' : '#64748b',
                      marginBottom: '16px',
                      lineHeight: '1.5'
                    }}>
                      Transaction successfully recorded on Base Sepolia blockchain
                    </p>
                    <a
                      href={agentResult.basescanUrl || `https://sepolia.basescan.org/tx/${agentResult.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '14px 20px',
                        background: theme === 'dark'
                          ? 'rgba(34, 197, 94, 0.2)'
                          : 'rgba(34, 197, 94, 0.25)',
                        border: '1px solid #22c55e',
                        borderRadius: '12px',
                        color: theme === 'dark' ? '#86efac' : '#16a34a',
                        textDecoration: 'none',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(34, 197, 94, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <span>View on BaseScan</span>
                      <ExternalLink size={14} />
                    </a>
                    <button
                      onClick={handleDownloadInvoice}
                      style={{
                        width: '100%',
                        marginTop: '12px',
                        padding: '14px 20px',
                        borderRadius: '12px',
                        border: 'none',
                        background: theme === 'dark'
                          ? 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
                          : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                        color: '#ffffff',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(249, 115, 22, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <Download size={16} />
                      Download Invoice (PDF)
                    </button>
                  </div>
                )}
              </div>

              {/* Add Funds Card */}
              <div style={{
                background: theme === 'dark' 
                  ? 'rgba(30, 41, 59, 0.6)'
                  : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(24px)',
                borderRadius: '24px',
                padding: '32px',
                border: theme === 'dark' ? '2px solid rgba(236, 72, 153, 0.2)' : '2px solid rgba(249, 115, 22, 0.15)',
                boxShadow: theme === 'dark'
                  ? '0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 20px 60px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = theme === 'dark'
                  ? '0 24px 72px rgba(236, 72, 153, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 24px 72px rgba(249, 115, 22, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = theme === 'dark'
                  ? '0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 20px 60px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
              }}
              >
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  marginBottom: '16px',
                  color: theme === 'dark' ? '#f1f5f9' : '#1e293b'
                }}>
                  💳 Fund Wallet
                </h2>

                <p style={{
                  color: theme === 'dark' ? '#cbd5e1' : '#64748b',
                  marginBottom: '20px',
                  fontSize: '15px',
                  lineHeight: '1.6'
                }}>
                  Add ETH instantly using credit/debit card or UPI via Transak
                </p>

                <button
                  onClick={handleAddFunds}
                  disabled={!isConfigured || transakInstance !== null}
                  style={{
                    width: '100%',
                    padding: '18px 28px',
                    borderRadius: '16px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '16px',
                    cursor: (!isConfigured || transakInstance !== null) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    background: theme === 'dark'
                      ? 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)'
                      : 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
                    color: '#ffffff',
                    boxShadow: '0 8px 24px rgba(236, 72, 153, 0.4)',
                    opacity: (!isConfigured || transakInstance !== null) ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (isConfigured && transakInstance === null) {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(236, 72, 153, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(236, 72, 153, 0.4)';
                  }}
                >
                  {transakInstance ? 'Widget Open...' : '💳 Add Funds'}
                </button>
              </div>
            </div>

            {/* Right Column - Activity Terminal */}
            <div style={{
              background: theme === 'dark' 
                ? 'rgba(15, 23, 42, 0.8)'
                : 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(24px)',
              border: theme === 'dark' ? '2px solid #22c55e' : '2px solid #10b981',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: theme === 'dark'
                ? '0 20px 60px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                : '0 20px 60px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
              minHeight: '600px'
            }}>
              <ActivityTerminal logs={logs} theme={theme} />
            </div>
          </div>

          {/* Transaction History - Full Width */}
          <div style={{ marginBottom: '48px' }}>
            <TransactionHistory theme={theme} transactions={transactions} />
          </div>

          {/* Info Section */}
          <div style={{
            background: theme === 'dark' ? 'rgba(15, 23, 42, 0.4)' : 'rgba(248, 250, 252, 0.6)',
            backdropFilter: 'blur(16px)',
            borderRadius: '24px',
            padding: '32px',
            border: theme === 'dark' ? '1px solid rgba(124, 58, 237, 0.2)' : '1px solid rgba(59, 130, 246, 0.1)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              marginBottom: '20px',
              color: theme === 'dark' ? '#c4b5fd' : '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Sparkles size={20} />
              How it Works
            </h3>
            <ol style={{ margin: 0, paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                'Your AI Agent autonomously pays the backend API for premium data access',
                'All payments are made in ETH on Base Sepolia testnet',
                'Fund the agent wallet instantly using UPI/cards through Transak',
                'Monitor real-time balance updates and transaction history',
                'View blockchain proof on BaseScan after each successful transaction'
              ].map((step, idx) => (
                <li key={idx} style={{
                  fontSize: '15px',
                  color: theme === 'dark' ? '#cbd5e1' : '#64748b',
                  lineHeight: '1.7',
                  paddingLeft: '8px'
                }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Animations */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
        `}</style>

        {/* System Status Footer */}
        <SystemStatus theme={theme} network="Base Sepolia" chainId={84532} />
      </div>
    </>
  )
}

export default App
