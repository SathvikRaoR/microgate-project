import dotenv from 'dotenv';
import { createWalletClient, createPublicClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

dotenv.config();

// Configuration validation
const validateConfig = () => {
  const required = ['PRIVATE_KEY', 'RPC_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (!process.env.PRIVATE_KEY.startsWith('0x')) {
    throw new Error('PRIVATE_KEY must start with 0x');
  }
};

try {
  validateConfig();
} catch (error) {
  console.error('❌ Configuration Error:', error.message);
  process.exit(1);
}

// Configuration
const CONFIG = {
  API_URL: process.env.API_URL || 'http://localhost:3000',
  PAYMENT_AMOUNT: '0.0001', // ETH
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  CONFIRMATION_TIMEOUT: 60000 // 60 seconds
};

const account = privateKeyToAccount(process.env.PRIVATE_KEY);

const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(process.env.RPC_URL)
});

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.RPC_URL)
});

/**
 * Fetch API with retry logic
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {number} retries - Number of retries remaining
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(url, options = {}, retries = CONFIG.MAX_RETRIES) {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`⚠️ Request failed, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

/**
 * Wait for transaction confirmation with timeout
 * @param {string} hash - Transaction hash
 * @returns {Promise<object>} Transaction receipt
 */
async function waitForConfirmation(hash) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Transaction confirmation timeout')), CONFIG.CONFIRMATION_TIMEOUT);
  });

  const confirmationPromise = publicClient.waitForTransactionReceipt({ hash });

  return Promise.race([confirmationPromise, timeoutPromise]);
}

/**
 * Main agent execution function
 */
async function runAgent() {
  console.log('🤖 Agent Starting...');
  console.log(`📍 Agent Wallet: ${account.address}`);
  console.log(`🌐 API Endpoint: ${CONFIG.API_URL}/api/secret`);

  try {
    // Check wallet balance
    const balance = await publicClient.getBalance({ address: account.address });
    const balanceInEth = parseFloat(balance) / 1e18;
    console.log(`💰 Current Balance: ${balanceInEth.toFixed(6)} ETH`);

    if (balanceInEth < parseFloat(CONFIG.PAYMENT_AMOUNT)) {
      console.error('❌ Insufficient balance for payment');
      console.log(`   Required: ${CONFIG.PAYMENT_AMOUNT} ETH`);
      console.log(`   Available: ${balanceInEth.toFixed(6)} ETH`);
      process.exit(1);
    }

    // Step 1: Try to access the secret
    console.log('\n📡 Attempting to access /api/secret...');
    const response = await fetchWithRetry(`${CONFIG.API_URL}/api/secret`);
    
    if (response.status === 402) {
      const data = await response.json();
      console.log('⛔ Access Denied - Payment Required');
      console.log(`💵 Pay to: ${data.payTo}`);
      console.log(`💰 Amount: ${data.amount}`);
      console.log(`🌐 Network: ${data.network || 'Base Sepolia'}`);

      // Step 2: Make payment
      console.log('\n💸 Initiating Payment...');
      console.log(`💵 Sending ${CONFIG.PAYMENT_AMOUNT} ETH to ${data.payTo}`);
      
      const hash = await walletClient.sendTransaction({
        to: data.payTo,
        value: parseEther(CONFIG.PAYMENT_AMOUNT)
      });

      console.log(`📤 Transaction sent: ${hash}`);
      console.log('⏳ Waiting for confirmation...');

      const receipt = await waitForConfirmation(hash);
      
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      console.log(`🎫 Payment Hash: ${hash}`);
      console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);

      // Step 3: Retry with payment proof
      console.log('\n🔓 Retrying with payment proof...');
      
      const retryResponse = await fetchWithRetry(`${CONFIG.API_URL}/api/secret`, {
        headers: {
          'x-payment-hash': hash
        }
      });

      if (retryResponse.ok) {
        const secretData = await retryResponse.json();
        console.log('\n🎉 SUCCESS!');
        console.log(`🔐 Secret Revealed: "${secretData.secret}"`);
        console.log(`📜 Transaction: ${secretData.transactionHash}`);
        console.log(`✓ Verified: ${secretData.verified}`);
      } else {
        const errorData = await retryResponse.json();
        console.error('\n❌ Failed to access secret:');
        console.error(`   Error: ${errorData.error}`);
        if (errorData.details) console.error(`   Details: ${errorData.details}`);
        process.exit(1);
      }

    } else if (response.ok) {
      const data = await response.json();
      console.log('✅ Secret already accessible:', data.secret);
    } else {
      const errorData = await response.json();
      console.error('❌ Unexpected response:', errorData);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Agent Error:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Agent shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Agent shutting down...');
  process.exit(0);
});

// Run the agent
console.log('═'.repeat(60));
console.log('🚀 MicroGate AI Agent');
console.log('═'.repeat(60));
runAgent();
