# 🌐 MicroGate - AI Agent Payment Gateway

> **A developer-ready prototype micropayment system where autonomous AI agents pay for API access using cryptocurrency on Base Sepolia testnet.**

[![Status](https://img.shields.io/badge/status-prototype-yellow)](https://github.com/SathvikRaoR/microgate-project)
[![Network](https://img.shields.io/badge/network-Base%20Sepolia-blue)](https://sepolia.basescan.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-success)](https://github.com/SathvikRaoR/microgate-project/actions)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Live Demo](#-live-demo)
- [Security Architecture](#-security-architecture)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Tech Stack](#-tech-stack)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

MicroGate is a **developer-ready prototype** implementing the **x402 Payment Protocol** - a novel approach where AI agents autonomously pay for API access using blockchain transactions. This is a testnet demonstration on Base Sepolia, designed for educational purposes and proof-of-concept development.

### Why MicroGate?

- 🤖 **Autonomous Payments** - AI agents pay without human intervention
- 🔗 **Cryptographically Verified** - All transactions verified on Base Sepolia blockchain
- 💰 **Micro-transactions** - Pay-per-use model (0.0001 ETH minimum)
- 🛡️ **Enterprise Security** - 5-step validation chain with replay protection
- 🧪 **Fully Tested** - Automated test suite with CI/CD pipeline
- 🌍 **Global Access** - Works anywhere with internet connection

### ⚠️ Important Notice

**This is a TESTNET PROTOTYPE for Base Sepolia.** Not production-ready for mainnet. Never use real mainnet private keys. This project is intended for:
- Educational demonstrations
- Proof-of-concept development
- Blockchain payment protocol research
- Interview portfolio showcase

---

## ✨ Key Features

### 🚀 Core Protocol Features

| Feature | Description |
|---------|-------------|
| ⚡ **x402 Payment Protocol** | Industry-standard HTTP 402 status for pay-per-use APIs |
| 🔗 **Blockchain Verification** | Real-time on-chain transaction verification via viem |
| 🤖 **AI Agent Support** | Fully autonomous payment and retry logic |
| 💰 **Live Balance Monitoring** | Auto-refresh every 30 seconds + manual refresh |
| 🎨 **Golden Ratio UI** | φ-based responsive design with smooth animations |
| 🌓 **Theme Toggle** | Seamless light/dark mode with localStorage persistence |

### 🛡️ Enterprise Security Features

| Feature | Description |
|---------|-------------|
| 🔒 **5-Step Validation Chain** | Comprehensive payment verification (see below) |
| 🔄 **Replay Attack Protection** | Supabase-backed transaction deduplication |
| 🚫 **Rate Limiting** | 5 requests/minute per IP address |
| 🌐 **CORS Protection** | Configurable cross-origin resource sharing |
| 📝 **Comprehensive Logging** | Detailed console logs for each validation step |
| 🧪 **Automated Testing** | Jest + Supertest with GitHub Actions CI |

### 💳 Payment & Funding

| Feature | Description |
|---------|-------------|
| 💳 **Transak Integration** | Buy crypto with UPI (INR), credit cards, or bank transfer |
| 💵 **Multi-Currency** | Accepts ETH and USDC on Base Sepolia |
| 🔒 **Secure Transactions** | All payments verified on-chain before access granted |
| 📊 **Transaction History** | Complete audit trail in Supabase PostgreSQL |

---

## 🌐 Live Demo

### Deployed Applications

- **Frontend Dashboard**: https://microgate-project-m8fq.vercel.app/
- **Backend API**: https://microgate-backend.onrender.com
- **Health Check**: https://microgate-backend.onrender.com/api/health
- **Market Data**: https://microgate-backend.onrender.com/api/market-sentiment

### Local Development

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/health

---

## 🔐 Security Architecture

### 5-Step Validation Chain

Every payment request to `/api/premium-data` undergoes rigorous validation:

#### STEP 1: Chain ID Verification ⛓️
```javascript
Expected: Base Sepolia (Chain ID: 84532)
Validation: receipt.chainId === 84532n
Error Code: 400 if chain ID mismatch
```

#### STEP 2: Recipient Address Check 📬
```javascript
Expected: SELLER_WALLET_ADDRESS from environment
Validation: receipt.to.toLowerCase() === SERVER_WALLET.toLowerCase()
Error Code: 400 if payment sent to wrong address
```

#### STEP 3: Payment Amount Verification 💰
```javascript
Expected: >= 0.0001 ETH minimum
Validation: parseFloat(ethAmount) >= parseFloat(MIN_ETH_AMOUNT)
Error Code: 400 if insufficient payment
```

#### STEP 4: Transaction Status Check ✅
```javascript
Expected: Transaction must be 'success'
Validation: receipt.status === 'success'
Error Code: 400 if transaction failed
```

#### STEP 5: Replay Attack Protection 🔄
```javascript
Expected: Unique transaction hash (never used before)
Validation: Query Supabase for duplicate tx_hash
Error Code: 409 Conflict if transaction already processed
Action: Save tx_hash to database to prevent future replay
```

### Console Output Example

```
🔐 === 5-STEP VALIDATION CHAIN ===
Transaction Hash: 0xabc123...

[STEP 1/5] Chain ID Verification
  ➜ Chain ID: 84532
  ✅ PASSED: Base Sepolia confirmed

[STEP 2/5] Recipient Address Verification
  ➜ Recipient: 0x8f4e057c5ae678b68bb9c8d679e6524ac2ec7ebc
  ➜ Expected: 0x8f4e057c5ae678b68bb9c8d679e6524ac2ec7ebc
  ✅ PASSED: Correct recipient

[STEP 3/5] Payment Amount Verification
  ➜ Amount: 0.0001 ETH
  ➜ Minimum: 0.0001 ETH
  ✅ PASSED: Sufficient payment

[STEP 4/5] Transaction Status Verification
  ➜ Status: success
  ✅ PASSED: Transaction successful

[STEP 5/5] Replay Attack Protection
  ➜ Checking Supabase for duplicate tx_hash...
  ✅ PASSED: Transaction hash is unique
  💾 Transaction logged to database

✅ === ALL 5 STEPS PASSED ===
```

### Security Best Practices

✅ Environment variables for all secrets  
✅ Input validation on all endpoints  
✅ Rate limiting (5 req/min per IP)  
✅ CORS protection  
✅ Row Level Security in database  
✅ On-chain transaction verification  
✅ Replay attack prevention  
✅ Automated security audits in CI  

---

## 🚀 Quick Start

### One-Command Launch

```powershell
# Clone the repository
git clone https://github.com/SathvikRaoR/microgate-project.git
cd microgate-project

# Install dependencies
npm install

# Start both servers
npm start
```

**That's it!** The script will:
1. ✅ Run pre-flight checks
2. 🚀 Start backend server (port 3000)
3. 🌐 Start frontend server (port 5173)
4. 🎨 Open dashboard in browser

---

## 📦 Installation

### Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **npm** v9+ (included with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Supabase Account** (optional, for database features)

### Step 1: Clone Repository

```bash
git clone https://github.com/SathvikRaoR/microgate-project.git
cd microgate-project
```

### Step 2: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 3: Environment Configuration

See [Configuration](#-configuration) section below.

### Step 4: Start Servers

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## ⚙️ Configuration

### Backend Configuration

Create `backend/.env`:

```env
# Server Configuration
PORT=3000

# Blockchain Configuration
PRIVATE_KEY=your_testnet_private_key_here
WALLET_ADDRESS=0x8f4e057c5ae678b68bb9c8d679e6524ac2ec7ebc
RPC_URL=https://sepolia.base.org

# Supabase Configuration (Optional - for transaction history)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key-here

# Environment
NODE_ENV=development
```

⚠️ **SECURITY WARNING**: Never commit real API keys or private keys to GitHub. Use `.env` files (already in `.gitignore`). For production, use environment variable management services like Vercel Environment Variables or AWS Secrets Manager.

### Frontend Configuration

Create `frontend/.env`:

```env
# Agent Wallet (matches backend WALLET_ADDRESS)
VITE_AGENT_WALLET_ADDRESS=0x8f4e057c5ae678b68bb9c8d679e6524ac2ec7ebc

# Backend API URL
VITE_BACKEND_URL=http://localhost:3000

# Transak Configuration (for crypto purchases)
VITE_TRANSAK_API_KEY=your_key_here
VITE_TRANSAK_ENV=STAGING

# RPC Endpoint
VITE_RPC_URL=https://sepolia.base.org
```

⚠️ **Never commit real API keys to GitHub.** The `VITE_TRANSAK_API_KEY` shown in examples is a placeholder. Get your own key from [transak.com](https://transak.com/).

### How to Get API Keys

#### Transak API Key
1. Sign up at [transak.com](https://transak.com/)
2. Create a new project
3. Copy API key from dashboard
4. Use `STAGING` environment for testing
5. **Add allowed origins in Transak dashboard**:
   - `http://localhost:5173`
   - `https://microgate-project-m8fq.vercel.app`

#### Base Sepolia RPC
- Default: `https://sepolia.base.org` (public, rate-limited)
- Alchemy: Create project at [alchemy.com](https://alchemy.com/)
- Infura: Create project at [infura.io](https://infura.io/)

#### Supabase Credentials
1. Go to [supabase.com](https://supabase.com/)
2. Create new project
3. Run SQL from `database/supabase-setup.sql`
4. Get **Project URL** and **service_role key** from Settings → API

---

## 📡 API Documentation

### Base URL

```
Production: https://microgate-backend.onrender.com
Development: http://localhost:3000
```

### Endpoints

#### 1. Health Check

```http
GET /api/health
```

**Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2025-11-29T10:30:00.000Z",
  "network": "Base Sepolia",
  "wallet": "0x8f4e057c5ae678b68bb9c8d679e6524ac2ec7ebc"
}
```

#### 2. Market Sentiment (Public)

```http
GET /api/market-sentiment
```

**Response** (200 OK):
```json
{
  "asset": "ETH",
  "price": 3450.20,
  "sentiment": "Bullish",
  "volatility": "High",
  "timestamp": "2025-11-29T10:30:00.000Z",
  "source": "MicroGate Market Analytics"
}
```

**Description**: Returns realistic crypto market data for ETH. Price varies between $3350-$3550. Sentiment can be Bullish, Bearish, or Neutral. Volatility can be Low, Medium, or High.

#### 3. Premium Data Access (x402 Protocol)

```http
GET /api/premium-data
X-Payment-Hash: 0xabc123...
```

**Response WITHOUT Payment** (402 Payment Required):
```json
{
  "error": "Payment Required",
  "message": "Premium data access requires payment verification",
  "payTo": "0x8f4e057c5ae678b68bb9c8d679e6524ac2ec7ebc",
  "amount": "0.0001 ETH minimum",
  "network": "Base Sepolia (Chain ID: 84532)"
}
```

**Response WITH Valid Payment** (200 OK):
```json
{
  "success": true,
  "data": {
    "secret": "The Agent Economy is Live!",
    "premiumInsight": "Autonomous AI agents are revolutionizing blockchain payments",
    "validationSteps": 5,
    "verified": true
  },
  "transaction": {
    "hash": "0xabc123...",
    "from": "0xagent...",
    "amount": "0.0001 ETH",
    "chainId": 84532,
    "blockNumber": "12345678"
  },
  "timestamp": "2025-11-29T10:30:00.000Z"
}
```

**Error Responses**:

- **400 Bad Request**: Invalid payment hash format, wrong chain, insufficient amount
- **409 Conflict**: Transaction already used (replay attack prevented)
- **500 Internal Server Error**: Verification failed

#### 4. Get Transaction History

```http
GET /api/transactions?agent_address=0x...
```

**Response** (200 OK):
```json
{
  "success": true,
  "transactions": [
    {
      "id": "uuid",
      "agent_address": "0x...",
      "tx_hash": "0x...",
      "amount": "0.001000",
      "status": "confirmed",
      "created_at": "2025-11-29T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

## 🧪 Testing

### Automated Test Suite

MicroGate includes comprehensive tests using **Jest** and **Supertest**.

#### Install Test Dependencies

```bash
cd backend
npm install --save-dev jest supertest @jest/globals
```

#### Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test server.test.js

# Watch mode for development
npm test -- --watch
```

#### Test Coverage

```
Test Suites: 1 passed, 1 total
Tests:       23 passed, 23 total
Coverage:    ~75% statements, ~80% branches
```

### Test Categories

1. **Health Check Tests**
   - ✅ Returns 200 OK with status information
   - ✅ Returns valid ISO timestamp
   - ✅ Includes network and wallet info

2. **Market Sentiment Tests**
   - ✅ Returns 200 OK with market data
   - ✅ Valid sentiment values (Bullish/Bearish/Neutral)
   - ✅ Valid volatility values (Low/Medium/High)
   - ✅ Price is a positive number

3. **Premium Data Tests**
   - ✅ Returns 402 without payment header
   - ✅ Returns 402 with correct payment instructions
   - ✅ Accepts valid payment hash
   - ✅ Rejects invalid payment hash format
   - ✅ Requires 0x prefix

4. **Security Tests**
   - ✅ Requires payment header for premium endpoints
   - ✅ Validates payment hash format strictly
   - ✅ Handles missing headers gracefully
   - ✅ Validates hex format in transaction hashes

5. **Performance Tests**
   - ✅ Health check responds within 100ms
   - ✅ Handles multiple concurrent requests

### Continuous Integration

GitHub Actions automatically runs tests on every push to `main`:

```yaml
# .github/workflows/ci.yml
- Run tests on Node.js 18.x and 20.x
- Upload test results and coverage
- Perform security audit
- Check for syntax errors
```

View CI status: [GitHub Actions](https://github.com/SathvikRaoR/microgate-project/actions)

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | React | 18.2.0 | UI framework |
| | Viem | 2.7.0 | Ethereum library |
| | Vite | 5.4.21 | Build tool |
| | Transak SDK | 3.0.0 | Fiat on-ramp |
| | Lucide React | 0.263.1 | Icon library |
| **Backend** | Express | 4.18.0 | API server |
| | Viem | 2.7.0 | Blockchain interaction |
| | Supabase JS | 2.x | Database client |
| | Express Rate Limit | 7.1.5 | Rate limiting |
| **Testing** | Jest | 29.x | Test framework |
| | Supertest | 6.x | HTTP testing |
| **Infrastructure** | Base Sepolia | Testnet | Blockchain network |
| | Supabase | PostgreSQL | Database |
| | GitHub Actions | CI/CD | Automation |
| | Vercel | - | Frontend hosting |
| | Render | - | Backend hosting |

---

## 📁 Project Structure

```
microgate-project/
├── backend/
│   ├── server.js              # Express API with 5-step validation
│   ├── agent.js               # AI agent logic
│   ├── tests/
│   │   └── server.test.js     # Jest test suite (NEW)
│   ├── .env                   # Environment variables (gitignored)
│   └── package.json           # Dependencies + test scripts
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main dashboard (915 lines)
│   │   ├── main.jsx           # React entry point
│   │   ├── index.css          # Golden ratio styles
│   │   └── components/        # React components
│   ├── .env                   # Frontend config (gitignored)
│   └── package.json
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI pipeline (NEW)
├── database/
│   └── supabase-setup.sql     # Database schema
├── README.md                  # This file (comprehensive docs)
└── package.json               # Root workspace scripts
```

---

## 🐛 Troubleshooting

### Tests Failing

```bash
# Clear cache and reinstall
cd backend
rm -rf node_modules package-lock.json
npm install
npm test
```

### CI/CD Pipeline Errors

- Ensure `.github/workflows/ci.yml` is in the repository
- Check GitHub Actions tab for detailed error logs
- Verify Node.js version compatibility (18.x or 20.x)

### Payment Validation Failing

- Check backend console for validation step details
- Verify transaction is on Base Sepolia (Chain ID: 84532)
- Ensure payment is to correct wallet address
- Verify amount is >= 0.0001 ETH

### Database Connection Issues

- Verify Supabase URL and key in `backend/.env`
- Check Supabase dashboard for table existence
- Test connection: `curl http://localhost:3000/api/transactions`

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing`
3. Write tests for new features
4. Ensure all tests pass: `npm test`
5. Commit changes: `git commit -m 'feat: Add feature'`
6. Push to branch: `git push origin feature/amazing`
7. Open Pull Request

### Commit Convention

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
test: Add tests
refactor: Refactor code
chore: Update dependencies
ci: Update CI/CD pipeline
```

---

## 📄 License

MIT License - Copyright (c) 2025 MicroGate Team

See [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

- [Viem](https://viem.sh/) - Ethereum library
- [Transak](https://transak.com/) - Fiat on-ramp
- [Supabase](https://supabase.com/) - Database platform
- [Base](https://base.org/) - L2 blockchain network
- [Jest](https://jestjs.io/) - Testing framework

---

## 📞 Support

- 🐛 [GitHub Issues](https://github.com/SathvikRaoR/microgate-project/issues)
- 💬 [Discussions](https://github.com/SathvikRaoR/microgate-project/discussions)
- 📧 Email: support@microgate.dev

---

<div align="center">

**Built with ❤️ for the Agent Economy**

⭐ Star this repo | 🍴 Fork | 👀 Watch for updates

[⬆ Back to Top](#-microgate---ai-agent-payment-gateway)

</div>

---

**Last Updated**: November 29, 2025  
**Version**: 4.0.0  
**Status**: ✅ Developer-Ready Prototype (Testnet Only)
