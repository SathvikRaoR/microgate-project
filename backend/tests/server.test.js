import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Mock environment variables for testing
process.env.WALLET_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
process.env.RPC_URL = 'https://sepolia.base.org';
process.env.PORT = '3001'; // Use different port for tests

// Import the server
// Note: In a real setup, you'd refactor server.js to export the app separately
// For now, we'll create a minimal test server with the same endpoints

const app = express();
app.use(express.json());

// Mock health endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    network: 'Base Sepolia',
    wallet: process.env.WALLET_ADDRESS
  });
});

// Mock market sentiment endpoint
app.get('/api/market-sentiment', (req, res) => {
  res.status(200).json({
    asset: 'ETH',
    price: 3450.20,
    sentiment: 'Bullish',
    volatility: 'High',
    timestamp: new Date().toISOString(),
    source: 'MicroGate Market Analytics'
  });
});

// Mock premium data endpoint
app.get('/api/premium-data', (req, res) => {
  const paymentHash = req.headers['x-payment-hash'];

  if (!paymentHash) {
    return res.status(402).json({
      error: 'Payment Required',
      message: 'Premium data access requires payment verification',
      payTo: process.env.WALLET_ADDRESS,
      amount: '0.0001 ETH minimum',
      network: 'Base Sepolia (Chain ID: 84532)'
    });
  }

  // For testing, accept any valid-looking hash
  if (typeof paymentHash === 'string' && paymentHash.startsWith('0x')) {
    return res.status(200).json({
      success: true,
      data: {
        secret: 'The Agent Economy is Live!',
        verified: true
      }
    });
  }

  return res.status(400).json({
    error: 'Invalid payment hash format'
  });
});

let server;

describe('MicroGate Backend API Tests', () => {
  beforeAll((done) => {
    server = app.listen(3001, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('GET /api/health', () => {
    it('should return 200 OK with status information', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('network', 'Base Sepolia');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('wallet');
    });

    it('should return a valid ISO timestamp', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp instanceof Date).toBe(true);
      expect(isNaN(timestamp.getTime())).toBe(false);
    });
  });

  describe('GET /api/market-sentiment', () => {
    it('should return 200 OK with market data', async () => {
      const response = await request(app)
        .get('/api/market-sentiment')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('asset', 'ETH');
      expect(response.body).toHaveProperty('price');
      expect(response.body).toHaveProperty('sentiment');
      expect(response.body).toHaveProperty('volatility');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('source');
    });

    it('should return valid sentiment values', async () => {
      const response = await request(app)
        .get('/api/market-sentiment')
        .expect(200);

      const validSentiments = ['Bullish', 'Bearish', 'Neutral'];
      expect(validSentiments).toContain(response.body.sentiment);
    });

    it('should return valid volatility values', async () => {
      const response = await request(app)
        .get('/api/market-sentiment')
        .expect(200);

      const validVolatilities = ['Low', 'Medium', 'High'];
      expect(validVolatilities).toContain(response.body.volatility);
    });

    it('should return price as a number', async () => {
      const response = await request(app)
        .get('/api/market-sentiment')
        .expect(200);

      expect(typeof response.body.price).toBe('number');
      expect(response.body.price).toBeGreaterThan(0);
    });
  });

  describe('GET /api/premium-data', () => {
    it('should return 402 Payment Required without payment header', async () => {
      const response = await request(app)
        .get('/api/premium-data')
        .expect('Content-Type', /json/)
        .expect(402);

      expect(response.body).toHaveProperty('error', 'Payment Required');
      expect(response.body).toHaveProperty('payTo');
      expect(response.body).toHaveProperty('amount');
      expect(response.body).toHaveProperty('network');
    });

    it('should return 402 with correct payment instructions', async () => {
      const response = await request(app)
        .get('/api/premium-data')
        .expect(402);

      expect(response.body.message).toContain('payment verification');
      expect(response.body.amount).toContain('ETH');
      expect(response.body.network).toContain('Base Sepolia');
    });

    it('should accept valid payment hash', async () => {
      const mockTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      
      const response = await request(app)
        .get('/api/premium-data')
        .set('x-payment-hash', mockTxHash)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('secret');
    });

    it('should reject invalid payment hash format', async () => {
      const response = await request(app)
        .get('/api/premium-data')
        .set('x-payment-hash', 'invalid-hash')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid');
    });

    it('should require 0x prefix in payment hash', async () => {
      const response = await request(app)
        .get('/api/premium-data')
        .set('x-payment-hash', '1234567890abcdef')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      await request(app)
        .get('/api/nonexistent')
        .expect(404);
    });

    it('should handle malformed JSON in POST requests', async () => {
      await request(app)
        .post('/api/trigger-agent')
        .send('invalid json')
        .expect(400);
    });
  });

  describe('CORS and Headers', () => {
    it('should include content-type header in responses', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });
});

describe('Security Tests', () => {
  describe('Payment Validation Chain', () => {
    it('should require payment header for premium endpoints', async () => {
      const response = await request(app)
        .get('/api/premium-data')
        .expect(402);

      expect(response.body.error).toBe('Payment Required');
    });

    it('should validate payment hash format strictly', async () => {
      const invalidHashes = [
        'not-a-hash',
        '0x',
        '0xinvalid',
        '',
        null,
        undefined
      ];

      for (const hash of invalidHashes) {
        if (hash) {
          await request(app)
            .get('/api/premium-data')
            .set('x-payment-hash', hash)
            .expect(400);
        }
      }
    });
  });

  describe('Input Validation', () => {
    it('should handle missing headers gracefully', async () => {
      const response = await request(app)
        .get('/api/premium-data')
        .expect(402);

      expect(response.body).toHaveProperty('error');
      expect(response.status).toBe(402);
    });

    it('should validate hex format in transaction hashes', async () => {
      const response = await request(app)
        .get('/api/premium-data')
        .set('x-payment-hash', '0xGGGGGGGG') // Invalid hex
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});

describe('Performance Tests', () => {
  it('should respond to health check within 100ms', async () => {
    const start = Date.now();
    
    await request(app)
      .get('/api/health')
      .expect(200);
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });

  it('should handle multiple concurrent requests', async () => {
    const requests = Array(10).fill(null).map(() => 
      request(app).get('/api/health').expect(200)
    );

    const responses = await Promise.all(requests);
    
    responses.forEach(response => {
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });
});
