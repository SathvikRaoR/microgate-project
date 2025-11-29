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
 * @returns {Promise<object>} Result object with success status and data
 */
export async function runAgent() {
  console.log('🤖 Agent Starting...');
  console.log(`📍 Agent Wallet: ${account.address}`);
  console.log(`🌐 API Endpoint: ${CONFIG.API_URL}/api/premium-data`);

  try {
    // Check wallet balance
    const balance = await publicClient.getBalance({ address: account.address });
    const balanceInEth = Number(balance) / 1e18;
    console.log(`💰 Current Balance: ${balanceInEth.toFixed(6)} ETH`);

    const requiredAmount = parseFloat(CONFIG.PAYMENT_AMOUNT);
    const gasEstimate = 0.00005; // Estimated gas cost
    const minBalanceNeeded = requiredAmount + gasEstimate;
    
    console.log(`📊 Balance Check:`);
    console.log(`   Payment Required: ${requiredAmount} ETH`);
    console.log(`   Gas Buffer: ${gasEstimate} ETH`);
    console.log(`   Total Needed: ${minBalanceNeeded} ETH`);
    console.log(`   Current Balance: ${balanceInEth.toFixed(6)} ETH`);
    
    if (balanceInEth < minBalanceNeeded) {
      const shortfall = (minBalanceNeeded - balanceInEth).toFixed(6);
      throw new Error(`Insufficient balance. Required: ${minBalanceNeeded} ETH (${requiredAmount} ETH + ${gasEstimate} gas), Available: ${balanceInEth.toFixed(6)} ETH, Shortfall: ${shortfall} ETH`);
    }
    
    console.log(`✅ Balance sufficient: ${balanceInEth.toFixed(6)} ETH >= ${minBalanceNeeded} ETH`);


    // Step 1: Try to access the premium data
    console.log('\n📡 Attempting to access /api/premium-data...');
    const response = await fetchWithRetry(`${CONFIG.API_URL}/api/premium-data`);
    
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
      
      const retryResponse = await fetchWithRetry(`${CONFIG.API_URL}/api/premium-data`, {
        headers: {
          'x-payment-hash': hash
        }
      });

      if (retryResponse.ok) {
        const secretData = await retryResponse.json();
        console.log('\n🎉 SUCCESS!');
        console.log(`🔐 Premium Data: "${secretData.data?.secret || secretData.secret}"`);
        console.log(`📜 Transaction: ${secretData.transaction?.hash || hash}`);
        console.log(`✓ Verified: ${secretData.data?.verified || true}`);
        console.log(`🔗 View on BaseScan: https://sepolia.basescan.org/tx/${hash}`);
        
        // Return success data
        return {
          success: true,
          data: {
            secret: secretData.data?.secret || secretData.secret,
            transactionHash: hash,
            verified: true,
            paymentAmount: CONFIG.PAYMENT_AMOUNT,
            gasUsed: receipt.gasUsed.toString(),
            paymentTxHash: hash
          }
        };
      } else {
        const errorData = await retryResponse.json();
        throw new Error(errorData.error || 'Failed to access premium data after payment');
      }

    } else if (response.ok) {
      const data = await response.json();
      console.log('✅ Secret already accessible:', data.secret);
      
      return {
        success: true,
        data: {
          secret: data.secret,
          message: 'Secret was already accessible (no payment needed)'
        }
      };
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Unexpected response from server');
    }

  } catch (error) {
    console.error('\n❌ Agent Error:', error.message);
    throw error;
  }
}

// Only run directly if this file is executed (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('═'.repeat(60));
  console.log('🚀 MicroGate AI Agent');
  console.log('═'.repeat(60));
  
  runAgent()
    .then(result => {
      console.log('\n✅ Agent completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Agent failed:', error.message);
      process.exit(1);
    });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Agent shutting down...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n\n👋 Agent shutting down...');
    process.exit(0);
  });
}
