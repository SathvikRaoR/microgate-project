# 🌐 MicroGate - AI Agent Payment Gateway

> **A production-ready micropayment system where autonomous AI agents pay for API access using cryptocurrency on Base Sepolia testnet.**

[![Status](https://img.shields.io/badge/status-production-brightgreen)](https://github.com/SathvikRaoR/microgate-project)
[![Network](https://img.shields.io/badge/network-Base%20Sepolia-blue)](https://sepolia.basescan.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Version](https://img.shields.io/badge/version-3.0.0-orange)](https://github.com/SathvikRaoR/microgate-project/releases)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [What's New](#-whats-new-in-v30)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Database Setup](#-database-setup-supabase)
- [API Documentation](#-api-documentation)
- [Usage Guide](#-usage-guide)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

MicroGate implements the **x402 Payment Protocol** - a novel approach where AI agents autonomously pay for API access using blockchain transactions. When an agent requests premium data, the server responds with `402 Payment Required`, the agent sends cryptocurrency on-chain, and upon verification, receives the protected content.

### Why MicroGate?

- 🤖 **Autonomous Payments** - No human intervention needed
- 🔗 **Cryptographically Verified** - All transactions on Base Sepolia blockchain
- 💰 **Micro-transactions** - Pay only for what you use (0.0001 ETH minimum)
- 🌍 **Global Access** - Works anywhere with internet connection
- 🗄️ **Complete History** - Every transaction logged in Supabase database
- 🎨 **Beautiful UI** - Golden ratio design (φ = 1.618) with light/dark themes

### Live Demo

- **Frontend Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **Transactions API**: http://localhost:3000/api/transactions

---

## ✨ Key Features

### 🚀 Core Features

| Feature | Description |
|---------|-------------|
| ⚡ **x402 Payment Protocol** | Industry-standard HTTP 402 status for pay-per-use APIs |
| 🔗 **Blockchain Verification** | Real-time on-chain transaction verification via viem |
| 🤖 **AI Agent Support** | Fully autonomous payment and retry logic |
| 💰 **Live Balance Monitoring** | Auto-refresh every 30 seconds + manual refresh |
| 🎨 **Golden Ratio UI** | φ-based responsive design with smooth animations |
| 🌓 **Theme Toggle** | Seamless light/dark mode with localStorage persistence |

### 💳 Payment & Funding

| Feature | Description |
|---------|-------------|
| 💳 **Transak Integration** | Buy crypto with UPI (INR), credit cards, or bank transfer |
| 💵 **Multi-Currency** | Accepts ETH and USDC on Base Sepolia |
| 🔒 **Secure Transactions** | All payments verified on-chain before access granted |
| 📊 **Real-time Rates** | Live exchange rates from Transak API |

### 🗄️ Database & History

| Feature | Description |
|---------|-------------|
| 🗄️ **Supabase PostgreSQL** | Production-grade database with automatic backups |
| 📜 **Transaction History** | Complete audit trail of all payments |
| 🔗 **BaseScan Links** | Direct blockchain explorer links for transparency |
| 🔐 **Row Level Security** | Database-level access control with RLS policies |
| 🔄 **Auto-Logging** | Transactions saved automatically on verification |
| 🔍 **Filtering & Search** | Query transactions by wallet address |

### 🛡️ Security & Reliability

| Feature | Description |
|---------|-------------|
| 🔒 **Rate Limiting** | 5 requests/minute per IP address |
| 🌐 **CORS Protection** | Configurable cross-origin resource sharing |
| 🛡️ **Input Validation** | All API inputs sanitized and validated |
| 🔄 **Graceful Degradation** | Works without database configured |
| 📝 **Comprehensive Logging** | Detailed console logs for debugging |
| ⚠️ **Error Handling** | User-friendly error messages |

---

## 🆕 What's New in v3.0

### Database Integration 🗄️

**Major Update**: Full Supabase PostgreSQL integration for persistent transaction storage!

#### New Features

1. **📊 Transaction History Card**
   - Beautiful table view with Date | Hash | Amount | Status columns
   - Responsive design with horizontal scroll on mobile
   - Theme-aware styling (golden ratio colors)
   - Auto-refresh every 30 seconds

2. **🔗 BaseScan Integration**
   - Every transaction hash links to blockchain explorer
   - External link icon for visual clarity
   - Opens in new tab for seamless UX

3. **🗄️ Supabase Backend**
   - PostgreSQL database with proper schema
   - Row Level Security (RLS) policies
   - Indexed queries for performance
   - Auto-updating timestamps with triggers

4. **🔄 Automatic Logging**
   - Transactions saved on payment verification
   - Includes: wallet address, tx hash, amount, status
   - Graceful error handling (doesn't break payment flow)

5. **📡 New API Endpoint**
   - `GET /api/transactions` - Fetch transaction history
   - Query parameter: `?agent_address=0x...` for filtering
   - Returns JSON with success status and transaction array

#### Database Schema

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_address TEXT NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  amount NUMERIC(18, 6) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for query performance
CREATE INDEX idx_transactions_agent_address ON transactions(agent_address);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_status ON transactions(status);
```

### Previous Updates (v2.0)

- ✅ Fixed blank screen issue (removed wagmi dependency)
- ✅ Implemented golden ratio UI design
- ✅ Added light/dark theme toggle
- ✅ Auto-refresh balance every 30 seconds
- ✅ Network status monitoring
- ✅ Improved error handling

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

### Access the Application

- **Dashboard**: http://localhost:5173
- **API**: http://localhost:3000/api/health
- **Transactions**: http://localhost:3000/api/transactions

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Viem)                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  • Light/Dark Theme Toggle                          │    │
│  │  • Real-time Balance Monitoring                     │    │
│  │  • Transaction History Table                        │    │
│  │  • Transak Payment Widget                           │    │
│  │  • Agent Control Panel                              │    │
│  └─────────────────────────────────────────────────────┘    │
│                         Port: 5173                          │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTP REST API
┌──────────────────────────▼───────────────────────────────────┐
│                    BACKEND (Express.js)                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  • x402 Payment Protocol Handler                    │    │
│  │  • On-chain Transaction Verification               │    │
│  │  • Rate Limiting (5 req/min per IP)                │    │
│  │  • CORS Protection                                  │    │
│  │  • Supabase Transaction Logging                    │    │
│  │  • AI Agent Process Management                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                         Port: 3000                           │
└──────────────────────────┬───────────────────────────────────┘
                           │ JSON-RPC / PostgreSQL
          ┌────────────────┴────────────────┐
          │                                 │
┌─────────▼──────────┐          ┌──────────▼─────────┐
│  BASE SEPOLIA      │          │  SUPABASE DB       │
│  TESTNET           │          │  (PostgreSQL)      │
│                    │          │                    │
│  • Balance Queries │          │  • Transaction Log │
│  • TX Verification │          │  • RLS Policies    │
│  • Smart Contracts │          │  • Auto-backups    │
└────────────────────┘          └────────────────────┘
```

### Data Flow

1. **User Funds Wallet** → Transak widget → USDC/ETH to wallet
2. **User Activates Agent** → Frontend → Backend spawns agent
3. **Agent Requests Data** → Backend returns `402 Payment Required`
4. **Agent Sends Payment** → Base Sepolia blockchain transaction
5. **Backend Verifies** → Checks on-chain transaction + saves to Supabase
6. **Agent Gets Data** → Backend returns premium content
7. **Frontend Updates** → History table refreshes with new transaction

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
# Install root dependencies
npm install

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
# From project root
npm start
```

Or manually:

```bash
# Terminal 1 - Backend
cd backend
node server.js

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
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
WALLET_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
RPC_URL=https://sepolia.base.org
USDC_CONTRACT=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Supabase Configuration (Optional - for transaction history)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key-here
```

**How to get values:**

1. **PRIVATE_KEY & WALLET_ADDRESS**: 
   - Use a testnet wallet (e.g., Hardhat default account)
   - **Never use mainnet keys!**

2. **RPC_URL**: 
   - Default: `https://sepolia.base.org` (Base Sepolia testnet)
   - Or use Alchemy/Infura URLs

3. **SUPABASE_URL & SUPABASE_KEY**:
   - See [Database Setup](#-database-setup-supabase) section

### Frontend Configuration

Create `frontend/.env`:

```env
# Agent Wallet (matches backend WALLET_ADDRESS)
VITE_AGENT_WALLET_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Backend API URL
VITE_BACKEND_URL=http://localhost:3000

# Transak Configuration (for UPI payments)
VITE_TRANSAK_API_KEY=3fd3ee4e-dd3c-49be-89bc-7bd527402ddf
VITE_TRANSAK_ENV=STAGING

# RPC Endpoint
VITE_RPC_URL=https://sepolia.base.org
```

**How to get Transak API Key:**

1. Sign up at [transak.com](https://transak.com/)
2. Create a new project
3. Copy API key from dashboard
4. Use `STAGING` environment for testing

---

## 🗄️ Database Setup (Supabase)

### Why Supabase?

- 🔒 PostgreSQL with Row Level Security
- ⚡ Fast queries with automatic indexing
- 🌐 REST API auto-generated
- 📊 Real-time subscriptions (future feature)
- 💾 Automatic backups

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com/)
2. Click "Start your project"
3. Create new organization (if needed)
4. Create new project:
   - **Name**: microgate-db
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to you
5. Wait for project to provision (~2 minutes)

### Step 2: Run SQL Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Paste contents from `database/supabase-setup.sql` (76 lines)
4. Click **Run** button
5. Verify: ✅ Success message shown

### Step 3: Get API Credentials

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **service_role key** (NOT anon key): `eyJhbGciOi...`
3. Add to `backend/.env`:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOi... (service_role key)
```

### Step 4: Verify Setup

Restart backend server:

```bash
cd backend
node server.js
```

Look for:
```
✅ Supabase client initialized
🚀 MicroGate Backend running on port 3000
```

---

## 📡 API Documentation

### Base URL

```
http://localhost:3000
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
  "wallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

#### 2. Get Transaction History

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

#### 3. Premium Data Access (x402)

```http
GET /api/premium-data
X-Payment-Hash: 0x...
```

**Response** (200 OK after payment):
```json
{
  "success": true,
  "data": {
    "secret": "The answer is 42",
    "timestamp": "2025-11-29T10:30:00.000Z"
  }
}
```

---

## 📚 Usage Guide

### 1. View Agent Balance

Dashboard automatically displays ETH balance and auto-refreshes every 30 seconds. Click refresh icon for manual update.

### 2. Fund Your Agent Wallet

**Option A: Faucet** (Free)
- Visit [Coinbase Faucet](https://www.coinbase.com/faucets)
- Paste wallet address
- Request testnet ETH

**Option B: Transak** (UPI/Card)
- Click "Fund Agent (UPI)" button
- Complete payment in widget
- USDC credited in 2-5 minutes

### 3. Activate AI Agent

1. Ensure wallet has ≥ 0.0001 ETH
2. Click "Activate Agent" button
3. Agent sends payment and receives data
4. Transaction appears in history table

### 4. View Transaction History

History card shows all past transactions with:
- Date & time
- Transaction hash (links to BaseScan)
- Amount in ETH
- Status badge (confirmed/pending/failed)

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2.0 |
| | Viem | 2.7.0 |
| | Vite | 5.4.21 |
| | Transak SDK | 3.0.0 |
| Backend | Express | 4.18.0 |
| | Viem | 2.7.0 |
| | Supabase JS | 2.x |
| Infrastructure | Base Sepolia | Testnet |
| | Supabase | PostgreSQL |
| | Transak | Payment Gateway |

---

## 📁 Project Structure

```
microgate-project/
├── backend/
│   ├── server.js              # Express API (329 lines)
│   ├── agent.js               # AI agent logic
│   ├── .env                   # Environment variables
│   └── package.json           # Dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main dashboard (789 lines)
│   │   ├── main.jsx           # React entry
│   │   └── index.css          # Golden ratio styles
│   ├── index.html
│   ├── .env                   # Frontend config
│   └── package.json
├── database/
│   └── supabase-setup.sql     # DB schema (76 lines)
├── package.json               # Root scripts
└── README.md                  # This file
```

---

## 🔐 Security

### Implemented Best Practices

✅ Environment variables for secrets  
✅ Input validation on all endpoints  
✅ Rate limiting (5 req/min per IP)  
✅ CORS protection  
✅ Row Level Security (database)  
✅ On-chain transaction verification  

### Production Checklist

- [ ] Generate new wallet keys
- [ ] Use mainnet RPC endpoints
- [ ] Configure production CORS
- [ ] Enable HTTPS
- [ ] Implement JWT authentication
- [ ] Add API key management
- [ ] Set up monitoring/alerts

⚠️ **This is a testnet application - do NOT use for mainnet without security audit!**

---

## 🐛 Troubleshooting

### Blank Screen
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules
npm install
npm run dev
```

### Balance Not Loading
- Check RPC endpoint in `.env`
- Try alternative RPC (Alchemy/Infura)
- Verify network status in footer

### Transaction History Empty
- Ensure Supabase configured in `backend/.env`
- Check table exists in Supabase dashboard
- Test API: `curl http://localhost:3000/api/transactions`

### Ports In Use
```powershell
Get-Process node | Stop-Process -Force
npm start
```

### More Help
- Check browser console (F12)
- Check backend logs
- [GitHub Issues](https://github.com/SathvikRaoR/microgate-project/issues)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature/amazing`
5. Open Pull Request

Follow conventional commits:
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

---

## 📄 License

MIT License - Copyright (c) 2025 MicroGate Team

---

## 🙏 Acknowledgments

- [Viem](https://viem.sh/) - Ethereum library
- [Transak](https://transak.com/) - Fiat on-ramp
- [Supabase](https://supabase.com/) - Database
- [Base](https://base.org/) - L2 network
- [Lucide](https://lucide.dev/) - Icons

---

## 📞 Support

- 🐛 [GitHub Issues](https://github.com/SathvikRaoR/microgate-project/issues)
- 💬 [Discussions](https://github.com/SathvikRaoR/microgate-project/discussions)
- 📧 Email: sathvikrao@example.com

---

<div align="center">

**Built with ❤️ by the MicroGate Team**

⭐ Star this repo | 🍴 Fork | 👀 Watch for updates

[⬆ Back to Top](#-microgate---ai-agent-payment-gateway)

</div>

---

**Last Updated**: November 29, 2025  
**Version**: 3.0.0  
**Status**: ✅ Production Ready (Testnet)
