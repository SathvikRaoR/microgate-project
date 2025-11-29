# MicroGate Testing Guide

## 🧪 Testing the Complete System

### Prerequisites
1. Both servers running:
   - Backend: `http://localhost:3000`
   - Frontend: `http://localhost:5173`

### Test 1: Check Balance
1. Open frontend at `http://localhost:5173`
2. View the **Agent Balance** card
3. You should see the wallet address and current ETH balance
4. Click **Refresh Balance** to update

### Test 2: Fund the Agent Wallet
**Option A: Using Transak (UPI - India)**
1. Get a Transak API key from https://transak.com/
2. Add to `frontend/.env`: `VITE_TRANSAK_API_KEY=your_key_here`
3. Restart frontend server
4. Click **Add Funds via UPI**
5. Complete UPI payment in the widget
6. If widget doesn't close automatically, click **✕ Close Payment Widget**

**Option B: Using Base Sepolia Faucet**
1. Visit https://www.alchemy.com/faucets/base-sepolia
2. Enter your agent wallet address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
3. Request testnet ETH
4. Wait for transaction to confirm
5. Refresh balance on dashboard

### Test 3: Activate the Agent
1. Ensure agent has at least **0.0001 ETH** balance
2. Click **Activate Agent** button
3. Wait for execution (status will show "Agent Running...")
4. On success, you'll see:
   - ✅ Success message
   - **Proof of Work** section with transaction hash
   - Clickable link to view on BaseScan
5. Click the BaseScan link to verify the transaction on blockchain

### Test 4: Theme Toggle
1. Click the Sun/Moon icon in top-right corner
2. Toggle between light and dark modes
3. Verify all text is readable in both modes
4. Theme preference is saved to localStorage

### Test 5: Rate Limiting (Backend)
Run the automated test suite:
```bash
cd backend
node test-suite.js
```

This will test:
- ✅ Backend health endpoint
- ✅ Agent balance checking
- ✅ Payment validation
- ✅ Agent execution
- ✅ Rate limiting (5 req/min)

### Test 6: CORS Configuration
The backend accepts requests from:
- `http://localhost:5173` (frontend dev)
- `http://localhost:3000` (backend)
- Any domain set in `FRONTEND_URL` environment variable

### Expected Behavior

#### Successful Agent Execution:
```
1. User clicks "Activate Agent"
2. Agent status: "activating"
3. Backend validates balance ≥ 0.0001 ETH
4. Agent executes payment transaction
5. Returns transaction hash
6. Frontend displays "Proof of Work" with BaseScan link
7. Balance refreshes automatically
```

#### Error Scenarios:
- **Insufficient Balance**: "Agent balance too low"
- **Rate Limited**: "Too many requests, try again after a minute"
- **Invalid Config**: "Please configure environment variables"
- **Network Error**: "Failed to connect to backend"

## 🐛 Troubleshooting

### Transak Widget Won't Close
- Click the **✕ Close Payment Widget** button below the "Add Funds" button
- Refresh the page if widget is stuck

### Agent Balance Not Updating
- Click **Refresh Balance** button
- Check RPC endpoint is responding: https://sepolia.base.org
- Verify wallet address is correct in `.env`

### Agent Execution Fails
- Check backend logs for errors
- Verify agent has sufficient ETH balance
- Check private key is set in backend `.env`
- Ensure RPC URL is accessible

### Rate Limiting Issues
- Wait 60 seconds between test runs
- Health endpoint (`/api/health`) is exempt from rate limits
- Rate limit: 5 requests per minute per IP address

## 📝 Manual Testing Checklist

- [ ] Backend server starts without errors
- [ ] Frontend loads at http://localhost:5173
- [ ] Agent balance displays correctly
- [ ] Wallet address is masked (shows first 6 + last 4 chars with bullets)
- [ ] Theme toggle works (Sun/Moon icon)
- [ ] All text is visible in both light and dark modes
- [ ] "Add Funds via UPI" opens Transak widget
- [ ] Close button appears when widget is open
- [ ] "Activate Agent" button works when balance > 0.0001 ETH
- [ ] Transaction proof appears after successful execution
- [ ] BaseScan link is clickable and opens in new tab
- [ ] Rate limiting blocks 6th+ request within 1 minute
- [ ] Health endpoint always responds (no rate limit)
- [ ] Balance auto-refreshes every 30 seconds
- [ ] Error messages display clearly
- [ ] Success messages appear and auto-dismiss

## 🚀 Production Deployment Testing

Before deploying to production:

1. **Environment Variables**
   - Set all production URLs
   - Use production Transak API key
   - Use production wallet address with real funds

2. **Security Checks**
   - Verify rate limiting is active
   - Confirm CORS only allows your domain
   - Check all API keys are not exposed in frontend

3. **Performance**
   - Test with slow network connections
   - Verify balance caching works
   - Check transaction confirmation times

4. **User Experience**
   - Test on mobile devices
   - Verify responsive design
   - Check all buttons are clickable
   - Ensure error messages are helpful

## 🎯 Success Criteria

The system is working correctly if:
- ✅ Users can view agent balance in real-time
- ✅ Users can fund agent via UPI (with valid API key)
- ✅ Agent executes payments when triggered
- ✅ Transaction proofs are displayed with BaseScan links
- ✅ Rate limiting protects backend from abuse
- ✅ Theme toggle provides accessible light/dark modes
- ✅ All features work without console errors
