# MicroGate - AI Agent Payment System 🚀

A cyberpunk-themed micropayment gateway where AI agents pay for API access using cryptocurrency on Base Sepolia.

![Status](https://img.shields.io/badge/status-production-green)
![Network](https://img.shields.io/badge/network-Base%20Sepolia-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- ⚡ **x402 Payment Rail** - Pay-per-use API access protocol
- 🔗 **Blockchain Verified** - Payment verification on Base Sepolia
- 🤖 **Autonomous Agent** - AI agent pays for services automatically
- 💰 **Real-time Balance** - Live ETH balance monitoring (auto-refresh every 30s)
- 💳 **UPI Payments** - Add funds via Transak (India: INR → USDC)
- 🎨 **Cyberpunk UI** - Black background, neon green, scanline effects
- 🔄 **No Wallet Required** - Direct RPC balance reading with viem

## 🎯 Quick Start

### One Command Start
```powershell
cd microgate-project
npm start
```

This automatically:
1. ✅ Runs pre-flight checks
2. 🚀 Starts backend (port 3000)
3. 🌐 Starts frontend (port 5173)
4. 🎨 Opens cyberpunk dashboard in browser

### Access Points
- **Frontend Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

---

## 📦 What's New (v2.0)
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your wallet details:
     - `PRIVATE_KEY`: Your wallet's private key (for agent)
     - `WALLET_ADDRESS`: Your wallet's public address (receives payments)
     - `RPC_URL`: Base Sepolia RPC endpoint (default provided)---

## 📦 What's New (v2.0)

### 🔥 Major Improvements
1. **Fixed Blank Screen** - Removed wagmi wallet dependency, direct viem RPC calls
2. **Cyberpunk UI Complete** - Full cyberpunk/hacker aesthetic with animations
3. **Auto-Refresh Balance** - Updates every 30 seconds automatically
4. **Network Status** - Live RPC connectivity monitoring
5. **Better Error Handling** - Clear error messages and recovery
6. **Simplified Architecture** - No wallet connection needed for viewing

See [IMPROVEMENTS.md](./IMPROVEMENTS.md) for detailed changelog.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│   FRONTEND (React + Viem)           │
│   - Cyberpunk Dashboard             │
│   - Balance Monitoring              │
│   - UPI Payment Integration         │
│   - Agent Control Panel             │
│   Port: 5173                        │
└──────────────┬──────────────────────┘
               │ HTTP REST API
┌──────────────▼──────────────────────┐
│   BACKEND (Express.js)              │
│   - Payment Verification            │
│   - x402 Protocol Handler           │
│   - Agent Process Manager           │
│   Port: 3000                        │
└──────────────┬──────────────────────┘
               │ JSON-RPC
┌──────────────▼──────────────────────┐
│   BASE SEPOLIA TESTNET              │
│   - Smart Contract Interactions     │
│   - Balance Queries                 │
│   - Transaction Verification        │
└─────────────────────────────────────┘
```

---

## 🎨 UI Preview

**Cyberpunk Dashboard Features:**
- ⬛ Pure black background (#000000)
- 🟢 Neon green accents (#00ff41)
- 📺 Scanline CRT effect overlay
- ✨ Glitch animation on title
- 💫 Smooth fade-in on cards
- 🎯 Lucide-react icons
- 🔄 Auto-updating balance
- 💳 Integrated UPI fueling station

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- PowerShell (Windows) or Bash (Linux/Mac)

### Step 1: Clone & Install
```powershell
git clone https://github.com/SathvikRaoR/microgate-project.git
cd microgate-project
npm install
```

### Step 2: Configure (Optional)
Create `.env` files if you want to override defaults:

**Backend** (`backend/.env`):
```env
PORT=3000
AGENT_WALLET_ADDRESS=0xYourWalletHere
PRIVATE_KEY=your_private_key_here
```

**Frontend** (`frontend/.env`):
```env
VITE_AGENT_WALLET_ADDRESS=0xYourWalletHere
VITE_TRANSAK_API_KEY=your_transak_api_key
```

### Step 3: Run
```powershell
npm start
```

---

## 📡 API Endpoints

### Health Check
```http
GET /api/health
```
Returns backend status and configuration.

### Trigger Agent
```http
POST /api/trigger-agent
Content-Type: application/json

{
  "wallet": "0xWalletAddress"
}
```
Spawns autonomous payment agent process.

### Payment Verification (x402 Protocol)
```http
GET /api/secret
X-Payment-Hash: 0xTransactionHash
```
Returns protected content after payment verification.

---

## 🎮 Usage Guide

### 1. View Balance
- Dashboard automatically displays ETH balance
- Click refresh icon to manually update
- Auto-refreshes every 30 seconds

### 2. Add Funds (UPI)
1. Click "ADD FUEL (UPI)" button
2. Transak widget opens
3. Select UPI payment method
4. Enter amount in INR
5. Complete UPI payment
6. USDC credited to wallet
7. Balance updates automatically

### 3. Activate Agent
1. Ensure wallet has sufficient balance
2. Click "ACTIVATE AGENT" button
3. Backend spawns agent process
4. Agent attempts API access
5. Pays if needed (402 response)
6. Retrieves protected content

---

## 🔧 Advanced Configuration

### Custom RPC Endpoint
Edit `frontend/src/App.jsx`:
```javascript
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://your-custom-rpc-url.com')
});
```

### Change Refresh Interval
Edit `frontend/src/App.jsx`:
```javascript
const CONFIG = {
  BALANCE_REFRESH_DELAY: 5000,  // Balance refresh after transaction
  // ...
};

// Auto-refresh interval in useEffect:
const interval = setInterval(fetchBalance, 30000); // Change 30000 to desired ms
```

### Modify Theme Colors
Edit `frontend/src/index.css` and `App.jsx`:
```css
/* Change neon green to another color */
:root {
  --neon-color: #00ff41; /* Change this */
}
```

---

## 🧪 Testing

### Test Backend
```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:3000/api/health"

# Expected output:
# {
#   "status": "healthy",
#   "network": "Base Sepolia",
#   "wallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
# }
```

### Test Frontend
1. Open http://localhost:5173
2. Check for:
   - ✅ Black background with neon green text
   - ✅ Scanline effect visible
   - ✅ Balance loading (or showing)
   - ✅ All 4 cards rendering
   - ✅ Footer showing RPC status

---

## 🛠️ Manual Setup

If automated start doesn't work:

### Backend
```powershell
cd backend
npm install
npm start
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

### Agent
```powershell
cd backend
npm run agent
```

---

## 📚 Project Structure

```
microgate-project/
├── backend/
│   ├── server.js           # Express API server
│   ├── agent.js            # Autonomous payment agent
│   ├── package.json        # Backend dependencies
│   └── .env.example        # Environment template
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main dashboard component
│   │   ├── main.jsx        # React entry point
│   │   └── index.css       # Cyberpunk styles & animations
│   ├── index.html          # HTML template
│   ├── vite.config.js      # Vite configuration
│   └── package.json        # Frontend dependencies
├── run.js                  # Cross-platform startup script
├── run.ps1                 # PowerShell runner (Windows)
├── run.sh                  # Bash runner (Linux/Mac)
├── package.json            # Root package configuration
├── README.md               # This file
└── IMPROVEMENTS.md         # Detailed changelog
```

---

## 🐛 Troubleshooting

### Blank Screen
**Solution**: Already fixed in v2.0. If still occurring:
1. Check browser console for errors
2. Ensure `npm start` shows both servers running
3. Clear browser cache and reload
4. Verify RPC endpoint is accessible

### Balance Not Loading
**Causes**:
- RPC endpoint down
- Wallet address invalid
- Network connectivity issue

**Solution**:
- Check footer "RPC STATUS" indicator
- Verify wallet address starts with "0x"
- Try manual refresh button

### Port Already in Use
```powershell
# Kill processes on ports 3000 and 5173
Get-Process node | Stop-Process -Force
```

### Node Modules Issues
```powershell
# Clean reinstall
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

---

## 📊 Tech Stack

### Frontend
- **React 18.2** - UI framework
- **Viem 2.7** - Ethereum interactions (no wallet needed)
- **Transak SDK 3.0** - Fiat on-ramp (UPI payments)
- **Lucide React** - Icon library
- **Vite 5.2** - Build tool & dev server

### Backend
- **Express 4.18** - API server
- **Viem 2.7** - Blockchain transactions
- **CORS** - Cross-origin support

### Blockchain
- **Base Sepolia** - Testnet
- **HTTP RPC** - No wallet provider needed

---

## 🔐 Security Notes

⚠️ **Important**:
- Never commit private keys to Git
- Use `.gitignore` for `.env` files
- Testnet only - not for mainnet use
- CORS configured for localhost only
- Input validation on all endpoints

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- **Viem** - Modern Ethereum library
- **Transak** - Fiat-to-crypto on-ramp
- **Lucide** - Beautiful icon library
- **Base** - Optimistic Ethereum L2

---

## 📞 Support

- 📧 Email: support@microgate.example
- 💬 Discord: [Join Server](#)
- 🐛 Issues: [GitHub Issues](https://github.com/SathvikRaoR/microgate-project/issues)
- 📖 Docs: See [IMPROVEMENTS.md](./IMPROVEMENTS.md)

---

**Built with ❤️ by the MicroGate Team**

**Last Updated**: November 29, 2025  
**Version**: 2.0.0  
**Status**: ✅ Production Ready
     - `VITE_TRANSAK_API_KEY`: Get from https://transak.com/

4. Start the development server:
```bash
npm run dev
```

### Running the AI Agent

1. Ensure the backend server is running
2. In the backend directory, run:
```bash
npm run agent
```

The agent will:
1. Try to access the protected `/api/secret` endpoint
2. Get rejected with 402 Payment Required
3. Automatically send payment to the server wallet
4. Retry with the payment hash
5. Successfully retrieve the secret

## Payment Details

- **Minimum Payment**: 0.0001 ETH on Base Sepolia
- **Alternative**: 0.01 USDC (if configured)
- **Network**: Base Sepolia Testnet

## How It Works

1. **Request**: Agent requests access to premium content
2. **402 Payment Required**: Server responds with payment details
3. **Payment**: Agent sends crypto payment on-chain
4. **Verification**: Server verifies the transaction
5. **Access Granted**: Agent receives the secret content

## Security Notes

- Never commit your `.env` file
- Keep your `PRIVATE_KEY` secure
- Use testnet for development
- Implement proper amount verification in production

## Technologies Used

- **Backend**: Express.js, Viem (Ethereum library)
- **Frontend**: React, Wagmi, Transak SDK
- **Blockchain**: Base Sepolia, Viem
- **Styling**: Tailwind CSS

## Troubleshooting

### CSS Warnings in VS Code
The Tailwind `@tailwind` directives may show warnings in VS Code. These are false positives and can be safely ignored.

### Transaction Verification Failed
- Ensure the payment is sent to the correct address
- Check that the amount meets the minimum requirement
- Verify the transaction was successful on-chain

### Agent Can't Connect
- Make sure the backend server is running on port 3000
- Check that your RPC_URL is accessible
- Verify your wallet has sufficient balance
