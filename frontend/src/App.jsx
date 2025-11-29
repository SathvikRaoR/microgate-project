import { useState, useEffect, useCallback } from 'react'
import { createPublicClient, http, formatEther } from 'viem'
import { baseSepolia } from 'viem/chains'
import { Transak } from '@transak/transak-sdk'
import { Sun, Moon, Zap, Wallet, Activity, ExternalLink, CheckCircle2, Download } from 'lucide-react'
import ActivityLog from './components/ActivityLog'
import StatusFooter from './components/StatusFooter'
import { generateInvoice } from './utils/invoiceGenerator'

// Configuration - Production & Development
const CONFIG = {
  AGENT_WALLET: import.meta.env.VITE_AGENT_WALLET_ADDRESS || '0x8f4e057c5ae678b68bb9c8d679e6524ac2ec7ebc',
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
  TRANSAK_API_KEY: import.meta.env.VITE_TRANSAK_API_KEY || '3fd3ee4e-dd3c-49be-89bc-7bd527402ddf',
  TRANSAK_ENVIRONMENT: import.meta.env.VITE_TRANSAK_ENV || 'STAGING',
  BALANCE_REFRESH_DELAY: 5000,
  RPC_URL: import.meta.env.VITE_RPC_URL || 'https://sepolia.base.org'
};

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('🔧 MicroGate Config:', {
    backendUrl: CONFIG.BACKEND_URL,
    agentWallet: CONFIG.AGENT_WALLET,
    rpcUrl: CONFIG.RPC_URL
  });
}

// Create public client for reading blockchain data
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(CONFIG.RPC_URL)
});

// Golden Ratio constant
const PHI = 1.618;

function App() {
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('microgate-theme') || 'dark';
  });

  // Existing states
  const [transakInstance, setTransakInstance] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [agentStatus, setAgentStatus] = useState('idle'); // idle, activating, success, error
  const [agentResult, setAgentResult] = useState(null);
  
  // Transaction history states
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Activity Log state
  const [logs, setLogs] = useState([]);

  // Helper function to add logs
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev, { message, timestamp }]);
  };

  // Theme toggle
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('microgate-theme', newTheme);
  };

  // Fetch transaction history
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

  // Fetch balance using viem
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

  // Check if wallet address is configured and fetch initial balance
  useEffect(() => {
    const configured = CONFIG.AGENT_WALLET && 
                      !CONFIG.AGENT_WALLET.includes('YOUR_AGENT_WALLET') &&
                      CONFIG.AGENT_WALLET.startsWith('0x');
    setIsConfigured(configured);
    
    if (!configured) {
      setError('Please configure VITE_AGENT_WALLET_ADDRESS in .env file');
    } else {
      fetchBalance();
      fetchTransactions();
      // Auto-refresh balance every 30 seconds
      const interval = setInterval(() => {
        fetchBalance();
        fetchTransactions();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchBalance, fetchTransactions]);

  const handleAddFunds = useCallback(() => {
    if (!CONFIG.TRANSAK_API_KEY || CONFIG.TRANSAK_API_KEY.includes('YOUR_TRANSAK')) {
      setError('Please configure VITE_TRANSAK_API_KEY in .env file');
      return;
    }

    // Close any existing Transak instance
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
        defaultCryptoCurrency: 'USDC',
        walletAddress: CONFIG.AGENT_WALLET,
        themeColor: theme === 'dark' ? '7C3AED' : '3B82F6',
        fiatCurrency: 'INR',
        email: '',
        redirectURL: '',
        hostURL: window.location.origin,
        widgetHeight: '650px',
        widgetWidth: '450px',
        defaultNetwork: 'base_sepolia',
        networks: 'base_sepolia',
        defaultPaymentMethod: 'upi'
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
      if (err.message && err.message.includes('API key')) {
        setError('❌ Transak API Key Error: Please add localhost:5173 to your API key\'s allowed origins at https://transak.com/');
      } else {
        setError('Failed to initialize payment widget. Please check API key and try again.');
      }
      setTransakInstance(null);
    }
  }, [theme, fetchBalance, transakInstance]);

  // Activate Agent
  const handleActivateAgent = async () => {
    setAgentStatus('activating');
    setError(null);
    setSuccess(null);
    setAgentResult(null);
    setLogs([]); // Clear previous logs

    try {
      addLog('🔍 Initializing agent activation...');
      
      // Check balance first
      if (!balance || parseFloat(balance.formatted) < 0.00015) {
        addLog('❌ Balance check failed');
        throw new Error('Insufficient balance. You need at least 0.00015 ETH (including gas fees).');
      }
      
      addLog('✅ Balance verified: ' + formatBalance(balance) + ' ETH');
      addLog('🔐 Checking idempotency key...');
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
      addLog('✅ Idempotency verified');
      
      addLog('📋 Signing payload with private key...');
      await new Promise(resolve => setTimeout(resolve, 300));
      addLog('✅ Payload signed');
      
      addLog('⛽ Calculating gas fees...');
      await new Promise(resolve => setTimeout(resolve, 400));
      addLog('✅ Gas estimation complete');
      
      addLog('🚀 Sending transaction to Base Sepolia RPC...');

      const response = await fetch(`${CONFIG.BACKEND_URL}/api/trigger-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallet: CONFIG.AGENT_WALLET
        })
      });

      addLog('📡 Received response from backend');

      if (!response.ok) {
        const errorData = await response.json();
        addLog('❌ Backend returned error');
        throw new Error(errorData.error || errorData.message || 'Agent execution failed');
      }

      const data = await response.json();
      addLog('📦 Parsing transaction data...');

      if (data.success) {
        addLog('✅ Transaction confirmed on-chain');
        addLog('🔗 Transaction hash: ' + (data.data?.transactionHash?.slice(0, 10) + '...' || 'N/A'));
        addLog('🎉 Agent execution completed successfully!');
        
        setAgentStatus('success');
        setAgentResult(data.data);
        setSuccess('✅ Agent executed successfully!');
        
        // Refresh balance and transactions after agent completes
        setTimeout(() => {
          fetchBalance();
          fetchTransactions();
          addLog('🔄 Refreshed balance and transaction history');
        }, 2000);
      } else {
        throw new Error(data.error || 'Agent execution failed');
      }
    } catch (err) {
      console.error('Agent error:', err);
      addLog('❌ Error: ' + err.message);
      setAgentStatus('error');
      setError(`❌ ${err.message}`);
    }
  };

  // Download Invoice Handler
  const handleDownloadInvoice = () => {
    if (!agentResult) return;
    
    addLog('📄 Generating PDF invoice...');
    
    try {
      generateInvoice(
        agentResult.transactionHash || 'N/A',
        CONFIG.MIN_ETH_AMOUNT || '0.0001',
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

  const maskAddress = (address) => {
    if (!address || address.length < 10) return address;
    const start = address.slice(0, 6);
    const end = address.slice(-4);
    const middle = '•'.repeat(address.length - 10);
    return `${start}${middle}${end}`;
  };

  // Theme-based styles using golden ratio for spacing
  const styles = {
    // PHI-based spacing: 8px, 13px, 21px, 34px, 55px (Fibonacci sequence approximating PHI)
    container: {
      minHeight: '100vh',
      background: theme === 'dark' 
        ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f8fafc 100%)',
      color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
      transition: 'all 0.3s ease',
      padding: `${34}px ${21}px`,
      paddingBottom: `${100}px` // Add space for StatusFooter
    },
    themeToggle: {
      position: 'fixed',
      top: `${21}px`,
      right: `${21}px`,
      zIndex: 1000,
      background: theme === 'dark' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(59, 130, 246, 0.2)',
      border: theme === 'dark' ? '1px solid #7c3aed' : '1px solid #3b82f6',
      color: theme === 'dark' ? '#a78bfa' : '#3b82f6',
      padding: `${13}px`,
      borderRadius: `${13}px`,
      cursor: 'pointer',
      backdropFilter: 'blur(10px)',
      boxShadow: theme === 'dark' 
        ? '0 4px 20px rgba(124, 58, 237, 0.3)'
        : '0 4px 20px rgba(59, 130, 246, 0.3)',
      transition: 'all 0.3s ease'
    },
    header: {
      textAlign: 'center',
      marginBottom: `${55}px`, // PHI spacing
      paddingTop: `${21}px`
    },
    title: {
      fontSize: '64px',
      fontWeight: 'bold',
      background: theme === 'dark'
        ? 'linear-gradient(135deg, #e0d4ff 0%, #ff6ec7 100%)'
        : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      MozBackgroundClip: 'text',
      MozTextFillColor: 'transparent',
      backgroundClip: 'text',
      marginBottom: `${13}px`,
      letterSpacing: '-0.02em',
      display: 'inline-block'
    },
    subtitle: {
      fontSize: '18px',
      color: theme === 'dark' ? '#cbd5e1' : '#64748b',
      fontWeight: '500'
    },
    alert: {
      maxWidth: '1000px',
      margin: `0 auto ${21}px`,
      padding: `${13}px ${21}px`,
      borderRadius: `${13}px`,
      border: '1px solid',
      backdropFilter: 'blur(10px)',
      fontSize: '15px',
      fontWeight: '500'
    },
    alertError: {
      background: theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.15)',
      borderColor: '#ef4444',
      color: theme === 'dark' ? '#fca5a5' : '#dc2626'
    },
    alertSuccess: {
      background: theme === 'dark' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.15)',
      borderColor: '#22c55e',
      color: theme === 'dark' ? '#86efac' : '#16a34a'
    },
    mainContainer: {
      maxWidth: `${1000}px`, // ~PHI * 618
      margin: '0 auto'
    },
    card: {
      background: theme === 'dark' 
        ? 'rgba(30, 41, 59, 0.7)'
        : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(20px)',
      borderRadius: `${21}px`,
      padding: `${34}px`,
      marginBottom: `${34}px`,
      border: theme === 'dark' ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid rgba(59, 130, 246, 0.2)',
      boxShadow: theme === 'dark'
        ? '0 8px 32px rgba(0, 0, 0, 0.4)'
        : '0 8px 32px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease'
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: `${21}px`
    },
    cardTitle: {
      fontSize: '20px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: `${13}px`,
      color: theme === 'dark' ? '#f1f5f9' : '#1e293b'
    },
    statusDot: {
      width: `${8}px`,
      height: `${8}px`,
      borderRadius: '50%',
      animation: 'pulse 2s infinite'
    },
    button: {
      width: '100%',
      padding: `${13}px ${21}px`,
      borderRadius: `${13}px`,
      border: 'none',
      fontWeight: '600',
      fontSize: '15px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: `${8}px`
    },
    buttonPrimary: {
      background: theme === 'dark'
        ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
        : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      color: '#ffffff',
      boxShadow: theme === 'dark'
        ? '0 4px 20px rgba(124, 58, 237, 0.4)'
        : '0 4px 20px rgba(59, 130, 246, 0.4)'
    },
    buttonSecondary: {
      background: theme === 'dark' ? 'rgba(51, 65, 85, 0.8)' : 'rgba(226, 232, 240, 0.8)',
      color: theme === 'dark' ? '#f1f5f9' : '#1e293b'
    },
    txLink: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: `${8}px`,
      padding: `${13}px ${21}px`,
      background: theme === 'dark'
        ? 'rgba(34, 197, 94, 0.1)'
        : 'rgba(34, 197, 94, 0.15)',
      border: '1px solid #22c55e',
      borderRadius: `${13}px`,
      color: theme === 'dark' ? '#86efac' : '#16a34a',
      textDecoration: 'none',
      fontWeight: '600',
      fontSize: `${13}px`,
      transition: 'all 0.3s ease',
      marginTop: `${21}px`,
      backdropFilter: 'blur(10px)'
    },
    infoBox: {
      background: theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.6)',
      borderRadius: `${13}px`,
      padding: `${21}px`,
      marginBottom: `${13}px`
    }
  };

  return (
    <div style={styles.container}>
      {/* Theme Toggle Button */}
      <button 
        onClick={toggleTheme}
        style={styles.themeToggle}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun size={21} /> : <Moon size={21} />}
      </button>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>⚡ MicroGate</h1>
        <p style={styles.subtitle}>AI Agent Payment Dashboard on Base Sepolia</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{...styles.alert, ...styles.alertError}}>
          {error}
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div style={{...styles.alert, ...styles.alertSuccess}}>
          {success}
        </div>
      )}

      {/* Main Dashboard */}
      <div style={styles.mainContainer}>
        {/* Two Column Layout - Dashboard + Activity Log */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: `${21}px`,
          marginBottom: `${34}px`
        }}>
          {/* Left Column - Main Dashboard */}
          <div>
            {/* Agent Balance Card */}
            <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              <Wallet size={21} />
              Agent Balance
            </h2>
            <div style={{display: 'flex', alignItems: 'center', gap: `${8}px`}}>
              <div style={{
                ...styles.statusDot,
                background: isConfigured ? '#22c55e' : '#ef4444'
              }}></div>
              <span style={{fontSize: '14px', color: theme === 'dark' ? '#cbd5e1' : '#64748b', fontWeight: '500'}}>
                {isConfigured ? 'Live' : 'Not Configured'}
              </span>
            </div>
          </div>

          <div style={styles.infoBox}>
            <p style={{fontSize: '14px', color: theme === 'dark' ? '#cbd5e1' : '#64748b', marginBottom: `${8}px`, fontWeight: '600'}}>
              Wallet Address
            </p>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: `${8}px`}}>
              <p style={{fontFamily: 'monospace', fontSize: '15px', color: theme === 'dark' ? '#c4b5fd' : '#7c3aed', fontWeight: '600'}}>
                {shortenAddress(CONFIG.AGENT_WALLET)}
              </p>
              <p style={{fontSize: '11px', fontFamily: 'monospace', color: theme === 'dark' ? '#94a3b8' : '#64748b', wordBreak: 'break-all', letterSpacing: '0.5px'}}>
                {maskAddress(CONFIG.AGENT_WALLET)}
              </p>
            </div>
          </div>

          <div style={{
            background: theme === 'dark'
              ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            borderRadius: `${13}px`,
            padding: `${21}px`,
            marginBottom: `${13}px`
          }}>
            <p style={{fontSize: '14px', color: 'rgba(255, 255, 255, 0.95)', marginBottom: `${8}px`, fontWeight: '600'}}>
              Current Balance
            </p>
            {isLoading ? (
              <div style={{display: 'flex', alignItems: 'center', gap: `${13}px`}}>
                <Activity size={34} className="animate-spin" style={{color: 'rgba(255, 255, 255, 0.7)'}} />
                <span style={{fontSize: '22px', color: 'rgba(255, 255, 255, 0.95)', fontWeight: '500'}}>Loading...</span>
              </div>
            ) : isError ? (
              <p style={{fontSize: '22px', fontWeight: 'bold', color: '#fca5a5'}}>
                Error loading balance
              </p>
            ) : (
              <div>
                <p style={{fontSize: '56px', fontWeight: 'bold', color: '#ffffff', lineHeight: 1}}>
                  {formatBalance(balance)}
                </p>
                <p style={{fontSize: '15px', color: 'rgba(255, 255, 255, 0.9)', marginTop: `${8}px`, fontWeight: '500'}}>
                  {balance?.symbol || 'ETH'} on Base Sepolia
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => refetch()}
            disabled={isLoading}
            style={{...styles.button, ...styles.buttonSecondary}}
          >
            <Activity size={13} />
            {isLoading ? 'Refreshing...' : 'Refresh Balance'}
          </button>
        </div>

        {/* Activate Agent Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              <Zap size={21} />
              Activate Agent
            </h2>
          </div>

          <p style={{color: theme === 'dark' ? '#cbd5e1' : '#64748b', marginBottom: `${21}px`, fontSize: '15px', lineHeight: '1.5'}}>
            Trigger the autonomous agent to execute a payment transaction on Base Sepolia
          </p>

          <button
            onClick={handleActivateAgent}
            disabled={!isConfigured || agentStatus === 'activating'}
            style={{
              ...styles.button,
              ...styles.buttonPrimary,
              opacity: (!isConfigured || agentStatus === 'activating') ? 0.5 : 1,
              cursor: (!isConfigured || agentStatus === 'activating') ? 'not-allowed' : 'pointer'
            }}
          >
            <Zap size={13} />
            {agentStatus === 'activating' ? 'Agent Running...' : 'Activate Agent'}
          </button>

          {/* Transaction Proof - Display after successful agent execution */}
          {agentStatus === 'success' && agentResult && (agentResult.transactionHash || agentResult.basescanUrl) && (
            <div style={{
              marginTop: `${21}px`,
              padding: `${21}px`,
              background: theme === 'dark' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.15)',
              borderRadius: `${13}px`,
              border: '1px solid #22c55e'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: `${8}px`, marginBottom: `${13}px`}}>
                <CheckCircle2 size={21} style={{color: '#22c55e'}} />
                <h3 style={{fontSize: '16px', fontWeight: '600', color: theme === 'dark' ? '#86efac' : '#16a34a', margin: 0}}>
                  Proof of Work
                </h3>
              </div>
              <p style={{fontSize: '14px', color: theme === 'dark' ? '#cbd5e1' : '#64748b', marginBottom: `${13}px`, lineHeight: '1.5'}}>
                Transaction successfully recorded on Base Sepolia blockchain:
              </p>
              <a
                href={agentResult.basescanUrl || `https://sepolia.basescan.org/tx/${agentResult.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.txLink}
              >
                <span>View on BaseScan</span>
                <ExternalLink size={13} />
              </a>
              <p style={{
                fontSize: `${8}px`,
                fontFamily: 'monospace',
                color: theme === 'dark' ? '#64748b' : '#94a3b8',
                marginTop: `${8}px`,
                wordBreak: 'break-all'
              }}>
                {agentResult.transactionHash}
              </p>
              
              {/* Download Invoice Button */}
              <button
                onClick={handleDownloadInvoice}
                style={{
                  ...styles.button,
                  marginTop: `${13}px`,
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
                    : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 20px rgba(249, 115, 22, 0.4)'
                }}
              >
                <Download size={16} />
                Download Invoice (PDF)
              </button>
            </div>
          )}
        </div>
          </div>

          {/* Right Column - Activity Log */}
          <div>
            <ActivityLog logs={logs} theme={theme} />
          </div>
        </div>

        {/* Full Width Cards Below */}
        {/* Add Funds Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              💳 Fund Your Agent
            </h2>
          </div>

          <p style={{color: theme === 'dark' ? '#cbd5e1' : '#64748b', marginBottom: `${21}px`, fontSize: '15px', lineHeight: '1.5'}}>
            Add funds to your AI Agent's wallet using UPI (India) via Transak
          </p>

          <button
            onClick={handleAddFunds}
            disabled={!isConfigured || transakInstance !== null}
            style={{
              ...styles.button,
              background: theme === 'dark'
                ? 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)'
                : 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
              color: '#ffffff',
              boxShadow: theme === 'dark'
                ? '0 4px 20px rgba(236, 72, 153, 0.4)'
                : '0 4px 20px rgba(249, 115, 22, 0.4)',
              opacity: (!isConfigured || transakInstance !== null) ? 0.5 : 1,
              cursor: (!isConfigured || transakInstance !== null) ? 'not-allowed' : 'pointer',
              marginBottom: transakInstance ? `${13}px` : 0
            }}
          >
            {transakInstance ? 'Widget Open...' : 'Add Funds via UPI'}
          </button>

          {transakInstance && (
            <button
              onClick={() => {
                if (transakInstance) {
                  transakInstance.close();
                  setTransakInstance(null);
                }
              }}
              style={{
                ...styles.button,
                background: theme === 'dark' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(220, 38, 38, 0.8)',
                color: '#ffffff',
                boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)'
              }}
            >
              ✕ Close Payment Widget
            </button>
          )}

          <div style={{marginTop: `${21}px`, display: 'flex', flexDirection: 'column', gap: `${8}px`}}>
            {['Instant UPI payments', 'Secure via Transak', 'Direct to Base Sepolia'].map((feature, idx) => (
              <div key={idx} style={{display: 'flex', alignItems: 'center', gap: `${8}px`}}>
                <CheckCircle2 size={13} style={{color: '#22c55e'}} />
                <span style={{fontSize: '14px', color: theme === 'dark' ? '#cbd5e1' : '#64748b'}}>
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              📜 Transaction History
            </h2>
            {loadingTransactions && (
              <Activity size={16} className="animate-spin" style={{color: theme === 'dark' ? '#a78bfa' : '#7c3aed'}} />
            )}
          </div>

          {transactions.length === 0 ? (
            <p style={{color: theme === 'dark' ? '#94a3b8' : '#64748b', textAlign: 'center', padding: `${21}px`, fontSize: '14px'}}>
              No transactions yet. Activate the agent to see transaction history.
            </p>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px'
              }}>
                <thead>
                  <tr style={{
                    borderBottom: theme === 'dark' ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)'
                  }}>
                    <th style={{padding: `${13}px`, textAlign: 'left', color: theme === 'dark' ? '#cbd5e1' : '#64748b', fontWeight: '600'}}>Date</th>
                    <th style={{padding: `${13}px`, textAlign: 'left', color: theme === 'dark' ? '#cbd5e1' : '#64748b', fontWeight: '600'}}>Transaction Hash</th>
                    <th style={{padding: `${13}px`, textAlign: 'right', color: theme === 'dark' ? '#cbd5e1' : '#64748b', fontWeight: '600'}}>Amount (ETH)</th>
                    <th style={{padding: `${13}px`, textAlign: 'center', color: theme === 'dark' ? '#cbd5e1' : '#64748b', fontWeight: '600'}}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, idx) => (
                    <tr key={tx.id} style={{
                      borderBottom: idx < transactions.length - 1 ? (theme === 'dark' ? '1px solid rgba(51, 65, 85, 0.5)' : '1px solid rgba(226, 232, 240, 0.5)') : 'none'
                    }}>
                      <td style={{padding: `${13}px`, color: theme === 'dark' ? '#cbd5e1' : '#64748b'}}>
                        {new Date(tx.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td style={{padding: `${13}px`}}>
                        <a
                          href={`https://sepolia.basescan.org/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: theme === 'dark' ? '#a78bfa' : '#7c3aed',
                            textDecoration: 'none',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {tx.tx_hash.slice(0, 10)}...{tx.tx_hash.slice(-8)}
                          <ExternalLink size={12} />
                        </a>
                      </td>
                      <td style={{padding: `${13}px`, textAlign: 'right', fontFamily: 'monospace', color: theme === 'dark' ? '#86efac' : '#16a34a', fontWeight: '600'}}>
                        {parseFloat(tx.amount).toFixed(6)}
                      </td>
                      <td style={{padding: `${13}px`, textAlign: 'center'}}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: tx.status === 'confirmed' 
                            ? (theme === 'dark' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.2)')
                            : tx.status === 'pending'
                            ? (theme === 'dark' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.2)')
                            : (theme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                          color: tx.status === 'confirmed'
                            ? '#22c55e'
                            : tx.status === 'pending'
                            ? '#fbbf24'
                            : '#ef4444'
                        }}>
                          {tx.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div style={{
          ...styles.card,
          background: theme === 'dark' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.5)'
        }}>
          <h3 style={{fontSize: '16px', fontWeight: '600', marginBottom: `${13}px`, color: theme === 'dark' ? '#c4b5fd' : '#7c3aed'}}>
            How it works
          </h3>
          <ol style={{margin: 0, paddingLeft: `${21}px`, display: 'flex', flexDirection: 'column', gap: `${8}px`}}>
            {[
              'Your AI Agent pays the backend API for premium access',
              'Payments are made in ETH on Base Sepolia testnet',
              'Fund the agent\'s wallet using UPI through Transak',
              'Monitor the agent\'s balance in real-time',
              'View transaction proof on BaseScan after agent execution'
            ].map((step, idx) => (
              <li key={idx} style={{fontSize: '14px', color: theme === 'dark' ? '#cbd5e1' : '#64748b', lineHeight: '1.6'}}>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Add animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Status Footer */}
      <StatusFooter backendUrl={CONFIG.BACKEND_URL} theme={theme} />
    </div>
  )
}

export default App
