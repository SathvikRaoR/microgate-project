# MicroGate - AI Agent Payment System

A micropayment gateway where AI agents pay for API access using cryptocurrency on Base Sepolia.

## Features

- ✅ Pay-per-use API access
- ✅ Blockchain payment verification
- ✅ AI agent autonomously pays for services
- ✅ Real-time balance monitoring
- ✅ UPI payments via Transak (India)

## Quick Start

### Automated Setup (Recommended)

1. **Run the setup wizard:**
```bash
npm run setup
```

2. **Configure environment files** (backend/.env and frontend/.env)

3. **Start everything:**
```bash
# Using npm (cross-platform)
npm start

# OR using PowerShell (Windows)
.\run.ps1

# OR using bash (Linux/Mac)
./run.sh

# To also run the agent:
.\run.ps1 -Agent          # Windows
./run.sh --agent          # Linux/Mac
```

## Manual Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your wallet details:
     - `PRIVATE_KEY`: Your wallet's private key (for agent)
     - `WALLET_ADDRESS`: Your wallet's public address (receives payments)
     - `RPC_URL`: Base Sepolia RPC endpoint (default provided)

4. Start the server:
### Running the AI Agent

**Option 1: With the main runner**
```bash
.\run.ps1 -Agent    # Windows
./run.sh --agent    # Linux/Mac
```

**Option 2: Separately**
1. Ensure the backend server is running
2. In the backend directory, run:
```bash
npm run agent
```

The agent will:
1. Check wallet balance
2. Try to access the protected `/api/secret` endpoint
3. Get rejected with 402 Payment Required
4. Automatically send payment to the server wallet
5. Wait for transaction confirmation
6. Retry with the payment hash
7. Successfully retrieve the secret

## Available Scripts

From the project root:

- `npm start` - Run backend and frontend servers
- `npm run setup` - Interactive setup wizard
- `npm run backend` - Run only the backend server
- `npm run frontend` - Run only the frontend
- `npm run agent` - Run the AI agent
- `npm run install-all` - Install all dependencies

From backend directory:
- `npm start` - Start the API server
- `npm run agent` - Run the AI agent

From frontend directory:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in:
     - `VITE_AGENT_WALLET_ADDRESS`: The agent's wallet address
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
