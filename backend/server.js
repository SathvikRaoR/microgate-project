import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createPublicClient, http, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';
import { isAddress } from 'viem';
import { runAgent } from './agent.js';

dotenv.config();

// Configuration validation
const validateConfig = () => {
  const required = ['WALLET_ADDRESS', 'RPC_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (!isAddress(process.env.WALLET_ADDRESS)) {
    throw new Error('Invalid WALLET_ADDRESS format');
  }

  if (process.env.USDC_CONTRACT && !isAddress(process.env.USDC_CONTRACT)) {
    throw new Error('Invalid USDC_CONTRACT format');
  }
};

validateConfig();

// Initialize Express app
const app = express();

// CORS Configuration - Allow Frontend URL + localhost for development
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
}));

// Rate Limiting - 5 requests per minute per IP
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again after a minute.',
    retryAfter: 60
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(express.json());

// Apply rate limiting to specific routes (not health check)
app.use('/api/trigger-agent', limiter);
app.use('/api/validate-payment', limiter);

// Initialize Viem client
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.RPC_URL)
});

// Constants
const CONFIG = {
  SERVER_WALLET: process.env.WALLET_ADDRESS,
  USDC_CONTRACT: process.env.USDC_CONTRACT,
  REQUIRED_AMOUNT_USDC: '0.01',
  MIN_ETH_AMOUNT: '0.0001',
  PORT: process.env.PORT || 3000
};

// Console colors for logging
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m'
};

function log(color, prefix, message) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

/**
 * Validates a payment transaction hash
 * @param {string} paymentHash - The transaction hash to validate
 * @returns {Promise<{valid: boolean, error?: string, secret?: string, transactionHash?: string}>}
 */
async function validatePayment(paymentHash) {
  if (!paymentHash || typeof paymentHash !== 'string' || !paymentHash.startsWith('0x')) {
    return { valid: false, error: 'Invalid payment hash format' };
  }

  try {
    console.log(`Verifying transaction: ${paymentHash}`);
    
    const receipt = await publicClient.getTransactionReceipt({
      hash: paymentHash
    });

    console.log('Receipt status:', receipt.status);

    if (receipt.status !== 'success') {
      return {
        valid: false,
        error: 'Transaction failed',
        details: `Status: ${receipt.status}`
      };
    }

    // Check if payment is to correct address
    const isToServerWallet = receipt.to?.toLowerCase() === CONFIG.SERVER_WALLET?.toLowerCase();
    const isToUSDC = CONFIG.USDC_CONTRACT && 
                     receipt.to?.toLowerCase() === CONFIG.USDC_CONTRACT?.toLowerCase();
    
    if (!isToServerWallet && !isToUSDC) {
      return {
        valid: false,
        error: 'Payment sent to wrong address',
        expected: `${CONFIG.SERVER_WALLET}${CONFIG.USDC_CONTRACT ? ` or ${CONFIG.USDC_CONTRACT}` : ''}`,
        received: receipt.to
      };
    }

    // Verify payment amount for ETH payments
    if (isToServerWallet) {
      const ethAmount = formatUnits(receipt.value || 0n, 18);
      console.log(`ETH payment amount: ${ethAmount} ETH`);
      
      if (parseFloat(ethAmount) < parseFloat(CONFIG.MIN_ETH_AMOUNT)) {
        return {
          valid: false,
          error: 'Insufficient payment amount',
          expected: `${CONFIG.MIN_ETH_AMOUNT} ETH minimum`,
          received: `${ethAmount} ETH`
        };
      }
    } else if (isToUSDC) {
      console.log('USDC payment detected');
    }

    console.log('Payment verified successfully!');
    
    return {
      valid: true,
      secret: 'The Agent Economy is Live!',
      transactionHash: paymentHash,
      verified: true
    };

  } catch (error) {
    console.error('Verification error:', error);
    return {
      valid: false,
      error: 'Could not verify transaction',
      details: error.message
    };
  }
}

/**
 * GET /api/secret - Protected endpoint requiring payment
 * Validates payment via x-payment-hash header
 */
app.get('/api/secret', async (req, res) => {
  const paymentHash = req.headers['x-payment-hash'];

  if (!paymentHash) {
    return res.status(402).json({
      error: 'Payment Required',
      payTo: CONFIG.SERVER_WALLET,
      amount: `${CONFIG.MIN_ETH_AMOUNT} ETH or ${CONFIG.REQUIRED_AMOUNT_USDC} USDC`,
      network: 'Base Sepolia'
    });
  }

  const result = await validatePayment(paymentHash);

  if (!result.valid) {
    return res.status(400).json({
      error: result.error,
      details: result.details,
      expected: result.expected,
      received: result.received
    });
  }

  return res.status(200).json({
    secret: result.secret,
    transactionHash: result.transactionHash,
    verified: result.verified
  });
});

/**
 * GET /api/health - Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    network: 'Base Sepolia',
    wallet: CONFIG.SERVER_WALLET
  });
});

/**
 * POST /api/trigger-agent - Trigger the autonomous agent
 * Executes the agent to autonomously pay for API access
 */
app.post('/api/trigger-agent', async (req, res) => {
  const { wallet } = req.body;

  log(colors.cyan, 'TRIGGER', `Agent activation requested for wallet: ${wallet || 'default'}`);

  try {
    log(colors.cyan, 'INFO', 'Executing agent...');
    
    // Execute the agent and await the result
    const result = await runAgent();

    if (result.success) {
      log(colors.green, 'SUCCESS', 'Agent completed successfully');
      
      return res.status(200).json({
        success: true,
        message: 'Agent completed successfully',
        data: {
          ...result.data,
          // Ensure transaction hash is included for frontend to display
          transactionHash: result.data?.transactionHash || result.data?.paymentTxHash,
          basescanUrl: result.data?.transactionHash 
            ? `https://sepolia.basescan.org/tx/${result.data.transactionHash}`
            : result.data?.paymentTxHash
            ? `https://sepolia.basescan.org/tx/${result.data.paymentTxHash}`
            : null
        },
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error('Agent returned unsuccessful result');
    }

  } catch (error) {
    console.error('❌ Agent execution error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute agent',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = CONFIG.PORT;
app.listen(PORT, () => {
  console.log(`🚀 MicroGate Backend running on port ${PORT}`);
  console.log(`💰 Accepting payments to: ${CONFIG.SERVER_WALLET}`);
  console.log(`🌐 Network: Base Sepolia`);
  console.log(`💵 Minimum payment: ${CONFIG.MIN_ETH_AMOUNT} ETH`);
});
