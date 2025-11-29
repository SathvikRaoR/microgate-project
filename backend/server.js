import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { createPublicClient, http, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';
import { isAddress } from 'viem';
import { runAgent } from './agent.js';

dotenv.config();

// Initialize Supabase client
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
  console.log('✅ Supabase client initialized');
} else {
  console.warn('⚠️  Supabase not configured. Transaction history will not be saved.');
}

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
};

validateConfig();

// Initialize Express app
const app = express();

// CORS Configuration - Production + Development
const allowedOrigins = [
  'https://microgate-project-m8fq.vercel.app', // Production frontend (Vercel)
  process.env.FRONTEND_URL, // Additional frontend URL from env
  'http://localhost:5173',   // Local development
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
].filter(Boolean); // Remove undefined values

console.log('🌐 Allowed CORS origins:', allowedOrigins);
console.log('🌐 NODE_ENV:', process.env.NODE_ENV);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS: Allowing origin:', origin);
      return callback(null, true);
    }
    
    // In production, also allow Vercel preview deployments and .vercel.app domains
    if (process.env.NODE_ENV === 'production' && 
        (origin.endsWith('.vercel.app') || origin.endsWith('.vercel.com'))) {
      console.log('✅ CORS: Allowing Vercel domain:', origin);
      return callback(null, true);
    }
    
    // Allow in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ CORS: Allowing in development mode:', origin);
      return callback(null, true);
    }
    
    // Reject
    console.log('❌ CORS: Blocking origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
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
 * GET /api/market-sentiment - Public Crypto Market Sentiment API
 * Returns realistic market data for ETH
 */
app.get('/api/market-sentiment', (req, res) => {
  const sentiments = ['Bullish', 'Bearish', 'Neutral'];
  const volatilities = ['Low', 'Medium', 'High'];
  
  // Generate realistic ETH price variation (base: $3450)
  const basePrice = 3450.20;
  const variation = (Math.random() - 0.5) * 200; // +/- $100
  const currentPrice = (basePrice + variation).toFixed(2);
  
  return res.status(200).json({
    asset: 'ETH',
    price: parseFloat(currentPrice),
    sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
    volatility: volatilities[Math.floor(Math.random() * volatilities.length)],
    timestamp: new Date().toISOString(),
    source: 'MicroGate Market Analytics'
  });
});

/**
 * GET /api/premium-data - Protected endpoint requiring payment
 * Implements 5-Step Validation Chain:
 * 1. Chain ID Check (Base Sepolia = 84532)
 * 2. Recipient Check (must be SELLER_WALLET_ADDRESS)
 * 3. Value Check (>= 0.0001 ETH)
 * 4. Status Check (transaction must be 'success')
 * 5. Replay Protection (check Supabase for duplicate tx_hash)
 */
app.get('/api/premium-data', async (req, res) => {
  const paymentHash = req.headers['x-payment-hash'];

  // No payment provided - return 402
  if (!paymentHash) {
    return res.status(402).json({
      error: 'Payment Required',
      message: 'Premium data access requires payment verification',
      payTo: CONFIG.SERVER_WALLET,
      amount: `${CONFIG.MIN_ETH_AMOUNT} ETH minimum`,
      network: 'Base Sepolia (Chain ID: 84532)'
    });
  }

  // Validate payment hash format
  if (typeof paymentHash !== 'string' || !paymentHash.startsWith('0x')) {
    return res.status(400).json({
      error: 'Invalid payment hash format',
      expected: '0x-prefixed transaction hash'
    });
  }

  try {
    console.log('\n🔐 === 5-STEP VALIDATION CHAIN ===');
    console.log(`Transaction Hash: ${paymentHash}`);

    // Fetch transaction receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: paymentHash
    });

    const tx = await publicClient.getTransaction({
      hash: paymentHash
    });

    // STEP 1: Chain ID Check
    console.log('\n[STEP 1/5] Chain ID Verification');
    const chainId = receipt.chainId || tx.chainId;
    console.log(`  ➜ Chain ID: ${chainId}`);
    
    if (chainId !== 84532n && chainId !== 84532) {
      console.log('  ❌ FAILED: Invalid chain ID');
      return res.status(400).json({
        error: 'Invalid blockchain network',
        expected: 'Base Sepolia (Chain ID: 84532)',
        received: `Chain ID: ${chainId}`,
        step: 1
      });
    }
    console.log('  ✅ PASSED: Base Sepolia confirmed');

    // STEP 2: Recipient Check
    console.log('\n[STEP 2/5] Recipient Address Verification');
    console.log(`  ➜ Recipient: ${receipt.to}`);
    console.log(`  ➜ Expected: ${CONFIG.SERVER_WALLET}`);
    
    const isCorrectRecipient = receipt.to?.toLowerCase() === CONFIG.SERVER_WALLET?.toLowerCase();
    
    if (!isCorrectRecipient) {
      console.log('  ❌ FAILED: Payment sent to wrong address');
      return res.status(400).json({
        error: 'Payment sent to incorrect address',
        expected: CONFIG.SERVER_WALLET,
        received: receipt.to,
        step: 2
      });
    }
    console.log('  ✅ PASSED: Correct recipient');

    // STEP 3: Value Check
    console.log('\n[STEP 3/5] Payment Amount Verification');
    const ethAmount = formatUnits(tx.value || 0n, 18);
    console.log(`  ➜ Amount: ${ethAmount} ETH`);
    console.log(`  ➜ Minimum: ${CONFIG.MIN_ETH_AMOUNT} ETH`);
    
    if (parseFloat(ethAmount) < parseFloat(CONFIG.MIN_ETH_AMOUNT)) {
      console.log('  ❌ FAILED: Insufficient payment');
      return res.status(400).json({
        error: 'Insufficient payment amount',
        expected: `${CONFIG.MIN_ETH_AMOUNT} ETH minimum`,
        received: `${ethAmount} ETH`,
        step: 3
      });
    }
    console.log('  ✅ PASSED: Sufficient payment');

    // STEP 4: Status Check
    console.log('\n[STEP 4/5] Transaction Status Verification');
    console.log(`  ➜ Status: ${receipt.status}`);
    
    if (receipt.status !== 'success') {
      console.log('  ❌ FAILED: Transaction not successful');
      return res.status(400).json({
        error: 'Transaction failed on blockchain',
        status: receipt.status,
        step: 4
      });
    }
    console.log('  ✅ PASSED: Transaction successful');

    // STEP 5: Replay Protection
    console.log('\n[STEP 5/5] Replay Attack Protection');
    console.log(`  ➜ Checking Supabase for duplicate tx_hash...`);
    
    if (!supabase) {
      console.log('  ⚠️  WARNING: Supabase not configured - skipping replay check');
    } else {
      // Check if transaction hash already exists
      const { data: existingTx, error: queryError } = await supabase
        .from('transactions')
        .select('tx_hash, created_at')
        .eq('tx_hash', paymentHash)
        .single();

      if (queryError && queryError.code !== 'PGRST116') { // PGRST116 = not found (OK)
        console.log('  ⚠️  Database query error:', queryError);
      }

      if (existingTx) {
        console.log('  ❌ FAILED: Transaction hash already used');
        console.log(`  ➜ First used at: ${existingTx.created_at}`);
        return res.status(409).json({
          error: 'Transaction already processed',
          message: 'This payment has already been used. Replay attack prevented.',
          originalUse: existingTx.created_at,
          step: 5
        });
      }
      console.log('  ✅ PASSED: Transaction hash is unique');

      // Save transaction to prevent replay
      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          agent_address: receipt.from,
          tx_hash: paymentHash,
          amount: parseFloat(ethAmount),
          status: 'confirmed'
        });

      if (insertError) {
        console.log('  ⚠️  Failed to save transaction:', insertError);
      } else {
        console.log('  💾 Transaction logged to database');
      }
    }

    console.log('\n✅ === ALL 5 STEPS PASSED ===\n');

    // All validations passed - return premium data
    return res.status(200).json({
      success: true,
      data: {
        secret: 'The Agent Economy is Live!',
        premiumInsight: 'Autonomous AI agents are revolutionizing blockchain payments',
        validationSteps: 5,
        verified: true
      },
      transaction: {
        hash: paymentHash,
        from: receipt.from,
        amount: `${ethAmount} ETH`,
        chainId: 84532,
        blockNumber: receipt.blockNumber.toString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('\n❌ Verification error:', error.message);
    return res.status(500).json({
      error: 'Transaction verification failed',
      details: error.message
    });
  }
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
 * GET /api/transactions - Get transaction history
 * Returns all transactions from Supabase database
 */
app.get('/api/transactions', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({
      error: 'Database not configured',
      message: 'Supabase is not set up. Please configure SUPABASE_URL and SUPABASE_KEY.'
    });
  }

  try {
    const { agent_address } = req.query;

    let query = supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    // Filter by agent address if provided
    if (agent_address) {
      query = query.eq('agent_address', agent_address);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({
        error: 'Failed to fetch transactions',
        details: error.message
      });
    }

    return res.status(200).json({
      success: true,
      transactions: data,
      count: data.length
    });

  } catch (error) {
    console.error('Transaction fetch error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
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
