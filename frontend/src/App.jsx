import { useState, useEffect, useCallback } from 'react'
import { useBalance } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import transakSDK from '@transak/transak-sdk'

// Configuration
const CONFIG = {
  AGENT_WALLET: import.meta.env.VITE_AGENT_WALLET_ADDRESS || '0xYOUR_AGENT_WALLET_ADDRESS_HERE',
  TRANSAK_API_KEY: import.meta.env.VITE_TRANSAK_API_KEY || 'YOUR_TRANSAK_API_KEY',
  TRANSAK_ENVIRONMENT: import.meta.env.VITE_TRANSAK_ENV || 'STAGING',
  BALANCE_REFRESH_DELAY: 5000
};

function App() {
  const [transakInstance, setTransakInstance] = useState(null);
  const [error, setError] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);

  const { data: balance, isLoading, isError, refetch } = useBalance({
    address: CONFIG.AGENT_WALLET,
    chainId: baseSepolia.id,
  });

  // Check if wallet address is configured
  useEffect(() => {
    const configured = CONFIG.AGENT_WALLET && 
                      !CONFIG.AGENT_WALLET.includes('YOUR_AGENT_WALLET');
    setIsConfigured(configured);
    
    if (!configured) {
      setError('Please configure VITE_AGENT_WALLET_ADDRESS in .env file');
    }
  }, []);

  const handleAddFunds = useCallback(() => {
    if (!CONFIG.TRANSAK_API_KEY || CONFIG.TRANSAK_API_KEY.includes('YOUR_TRANSAK')) {
      setError('Please configure VITE_TRANSAK_API_KEY in .env file');
      return;
    }

    try {
      const transak = new transakSDK({
        apiKey: CONFIG.TRANSAK_API_KEY,
        environment: CONFIG.TRANSAK_ENVIRONMENT,
        defaultCryptoCurrency: 'ETH',
        walletAddress: CONFIG.AGENT_WALLET,
        themeColor: '000000',
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
        console.log('Order successful:', orderData);
        transak.close();
        setTimeout(() => refetch(), CONFIG.BALANCE_REFRESH_DELAY);
      });

      transak.on(transak.EVENTS.TRANSAK_ORDER_FAILED, (orderData) => {
        console.log('Order failed:', orderData);
        setError('Transaction failed. Please try again.');
        transak.close();
      });

      transak.on(transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
        console.log('Widget closed');
        setTransakInstance(null);
      });

      setTransakInstance(transak);
      setError(null);
    } catch (err) {
      console.error('Transak initialization error:', err);
      setError('Failed to initialize payment widget. Please try again.');
    }
  }, [refetch]);

  const formatBalance = (bal) => {
    if (!bal) return '0.0000';
    return parseFloat(bal.formatted).toFixed(4);
  };

  const shortenAddress = (address) => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            MicroGate
          </h1>
          <p className="text-xl text-gray-300">
            AI Agent Payment Dashboard
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-900 bg-opacity-50 border border-red-500 rounded-xl p-4">
            <p className="text-red-200">⚠️ {error}</p>
          </div>
        )}

        {/* Main Dashboard */}
        <div className="max-w-2xl mx-auto">
          {/* Agent Balance Card */}
          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-purple-500 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Agent Balance</h2>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full animate-pulse ${isConfigured ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-400">
                  {isConfigured ? 'Live' : 'Not Configured'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-900 rounded-xl p-6">
                <p className="text-sm text-gray-400 mb-2">Wallet Address</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono text-purple-300 break-all">
                    {shortenAddress(CONFIG.AGENT_WALLET)}
                  </p>
                  <p className="text-xs text-gray-500 ml-2">
                    {CONFIG.AGENT_WALLET}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6">
                <p className="text-sm text-purple-200 mb-2">Current Balance</p>
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-12 bg-purple-400 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-purple-400 rounded w-1/2"></div>
                  </div>
                ) : isError ? (
                  <p className="text-2xl font-bold text-red-200">
                    Error loading balance
                  </p>
                ) : (
                  <div>
                    <p className="text-5xl font-bold">
                      {formatBalance(balance)}
                    </p>
                    <p className="text-lg text-purple-200 mt-1">
                      {balance?.symbol || 'ETH'} on Base Sepolia
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="w-full mt-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {isLoading ? '⏳ Loading...' : '🔄 Refresh Balance'}
            </button>
          </div>

          {/* Add Funds Card */}
          <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4">Fund Your Agent</h3>
            <p className="text-purple-100 mb-6">
              Add funds to your AI Agent's wallet using UPI (India) via Transak
            </p>
            
            <button
              onClick={handleAddFunds}
              disabled={!isConfigured}
              className="w-full bg-white text-purple-600 hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold py-4 px-6 rounded-xl transition-colors shadow-lg text-lg"
            >
              💳 Add Funds via UPI
            </button>

            <div className="mt-6 space-y-2 text-sm text-purple-100">
              <div className="flex items-center space-x-2">
                <span>✅</span>
                <span>Instant UPI payments</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>✅</span>
                <span>Secure via Transak</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>✅</span>
                <span>Direct to Base Sepolia</span>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-8 bg-gray-800 bg-opacity-30 rounded-xl p-6 border border-gray-700">
            <h4 className="text-lg font-semibold mb-3 text-purple-300">How it works</h4>
            <ol className="space-y-2 text-gray-300 text-sm list-decimal list-inside">
              <li>Your AI Agent pays the backend API for premium access</li>
              <li>Payments are made in ETH on Base Sepolia testnet</li>
              <li>Fund the agent's wallet using UPI through Transak</li>
              <li>Monitor the agent's balance in real-time</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
