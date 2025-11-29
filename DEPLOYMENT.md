# MicroGate Production Deployment Guide

## 🚀 Deployment Architecture

- **Backend**: Render.com (Node.js service)
- **Frontend**: Vercel (Static site with Vite)
- **Database**: Supabase (already configured)
- **Repository**: GitHub monorepo

---

## 📋 Pre-Deployment Checklist

### ✅ Verify Your Code is Ready

1. **Backend has `start` script**:
   ```json
   "scripts": {
     "start": "node server.js"
   }
   ```

2. **Frontend uses environment variables**:
   ```javascript
   BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
   ```

3. **CORS configured for production**:
   ```javascript
   allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173', ...]
   ```

4. **Git repository is up to date**:
   ```bash
   git add .
   git commit -m "Production ready: Add deployment configs"
   git push origin main
   ```

---

## 🎯 PART 1: Deploy Backend to Render

### Step 1: Create Render Account

1. Go to https://render.com
2. Click **"Get Started"**
3. Sign up with GitHub (recommended)
4. Authorize Render to access your repositories

### Step 2: Create New Web Service

1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. Connect your GitHub repository:
   - Search for `microgate-project`
   - Click **"Connect"**

### Step 3: Configure Service Settings

Fill in these **EXACT** values:

| Field | Value |
|-------|-------|
| **Name** | `microgate-backend` (or your choice) |
| **Region** | Choose closest to you (e.g., Oregon, Frankfurt) |
| **Branch** | `main` |
| **Root Directory** | `backend` ⚠️ **CRITICAL** |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (or Starter if you need more) |

### Step 4: Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these **REQUIRED** variables:

```env
# Server Configuration
PORT=3000

# Blockchain Configuration
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
WALLET_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
RPC_URL=https://sepolia.base.org
USDC_CONTRACT=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Supabase Configuration (from your Supabase dashboard)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key-here

# Frontend URL (ADD AFTER VERCEL DEPLOYMENT - See Part 2)
FRONTEND_URL=https://your-app.vercel.app
```

⚠️ **IMPORTANT**: You'll update `FRONTEND_URL` after deploying the frontend in Part 2!

### Step 5: Deploy!

1. Click **"Create Web Service"** button
2. Wait for deployment (2-5 minutes)
3. Watch build logs for errors
4. Look for: ✅ **"Your service is live"**

### Step 6: Test Backend

1. Copy your backend URL (e.g., `https://microgate-backend.onrender.com`)
2. Test health endpoint:
   ```bash
   curl https://microgate-backend.onrender.com/api/health
   ```
3. Expected response:
   ```json
   {
     "status": "ok",
     "network": "Base Sepolia",
     "wallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
   }
   ```

✅ **Backend deployed successfully!**

---

## 🌐 PART 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your repositories

### Step 2: Import Project

1. Click **"Add New..."** → **"Project"**
2. Find your repository: `microgate-project`
3. Click **"Import"**

### Step 3: Configure Project Settings

Fill in these **EXACT** values:

| Field | Value |
|-------|-------|
| **Project Name** | `microgate-app` (or your choice) |
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` ⚠️ **CRITICAL** - Click "Edit" |
| **Build Command** | `npm run build` (auto-detected) |
| **Output Directory** | `dist` (auto-detected) |
| **Install Command** | `npm install` (auto-detected) |

**How to set Root Directory:**

1. Click **"Edit"** next to "Root Directory"
2. Type: `frontend`
3. Vercel will show: `✓ frontend directory found`

### Step 4: Environment Variables

Click **"Environment Variables"** section

Add these variables:

```env
# Backend API URL (from Part 1 - your Render URL)
VITE_BACKEND_URL=https://microgate-backend.onrender.com

# Agent Wallet
VITE_AGENT_WALLET_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# RPC Configuration
VITE_RPC_URL=https://sepolia.base.org

# Transak Configuration
VITE_TRANSAK_API_KEY=3fd3ee4e-dd3c-49be-89bc-7bd527402ddf
VITE_TRANSAK_ENV=STAGING
```

⚠️ **Replace** `https://microgate-backend.onrender.com` with **YOUR** actual Render URL from Part 1!

### Step 5: Deploy!

1. Click **"Deploy"** button
2. Wait for build (1-3 minutes)
3. Watch build logs for errors
4. Look for: 🎉 **"Congratulations! Your project has been deployed"**

### Step 6: Test Frontend

1. Click **"Visit"** button or copy deployment URL
2. Your dashboard should load!
3. Test features:
   - ✅ Balance loads
   - ✅ Theme toggle works
   - ✅ Transaction history fetches from backend
   - ✅ Network status shows 🟢 Connected

✅ **Frontend deployed successfully!**

---

## 🔗 PART 3: Connect Frontend & Backend

### Step 1: Update Backend with Frontend URL

1. Go back to **Render dashboard**
2. Click on your `microgate-backend` service
3. Go to **"Environment"** tab
4. Find `FRONTEND_URL` variable
5. Update value to your Vercel URL:
   ```
   https://microgate-app.vercel.app
   ```
6. Click **"Save Changes"**
7. Render will automatically redeploy (30 seconds)

### Step 2: Verify CORS Working

1. Open your Vercel frontend URL
2. Open browser DevTools (F12) → Console
3. Look for: 🔧 **MicroGate Config: { backendUrl: "https://..." }**
4. Check for CORS errors (there should be none!)
5. Test API call by clicking "Activate Agent" or viewing transaction history

✅ **Frontend and Backend connected!**

---

## 🎉 Deployment Complete!

### Your Live URLs

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://microgate-backend.onrender.com`
- **API Health**: `https://microgate-backend.onrender.com/api/health`
- **Transactions**: `https://microgate-backend.onrender.com/api/transactions`

### Test Everything

1. ✅ Dashboard loads and displays UI
2. ✅ Agent balance fetches from blockchain
3. ✅ Theme toggle persists
4. ✅ Transaction history loads from Supabase
5. ✅ Transak widget opens for payments
6. ✅ Network status shows connected

---

## 🔧 Post-Deployment Configuration

### Custom Domain (Optional)

**Vercel Frontend:**
1. Go to your project → Settings → Domains
2. Add custom domain (e.g., `microgate.yourdomain.com`)
3. Follow DNS configuration instructions
4. Update `FRONTEND_URL` in Render backend

**Render Backend:**
1. Go to your service → Settings
2. Add custom domain (e.g., `api.microgate.yourdomain.com`)
3. Update `VITE_BACKEND_URL` in Vercel frontend

### Enable Production Mode

**Backend (Render):**
```env
NODE_ENV=production
```

**Frontend (Vercel):**
- Already in production mode automatically!

### Update Transak to Production

1. Go to [transak.com](https://transak.com/) dashboard
2. Create production API key
3. Update in Vercel:
   ```env
   VITE_TRANSAK_API_KEY=your-production-key
   VITE_TRANSAK_ENV=PRODUCTION
   ```

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Build fails on Render
```
Solution:
1. Check Node version in package.json (need >=18)
2. Verify Root Directory is set to "backend"
3. Check build logs for missing dependencies
```

**Problem**: CORS errors in browser
```
Solution:
1. Verify FRONTEND_URL in Render matches Vercel URL exactly
2. Check backend logs: "🌐 Allowed CORS origins: [...]"
3. Ensure no trailing slash in FRONTEND_URL
```

**Problem**: 503 Service Unavailable
```
Solution:
1. Free tier sleeps after 15 min inactivity
2. First request takes 30-60 seconds to wake up
3. Upgrade to paid plan for always-on
```

### Frontend Issues

**Problem**: "Failed to fetch" errors
```
Solution:
1. Check VITE_BACKEND_URL in Vercel env vars
2. Test backend health endpoint directly
3. Check browser console for exact error
```

**Problem**: Balance not loading
```
Solution:
1. Verify VITE_RPC_URL is set correctly
2. Check wallet address is valid
3. Test RPC endpoint directly with curl
```

**Problem**: Build fails on Vercel
```
Solution:
1. Verify Root Directory is "frontend" not "/"
2. Check for TypeScript errors (if any)
3. Review build logs for missing dependencies
```

### Supabase Issues

**Problem**: Transaction history empty
```
Solution:
1. Verify SUPABASE_URL and SUPABASE_KEY in Render
2. Check table exists: Supabase → Table Editor
3. Test API: https://your-backend.onrender.com/api/transactions
```

---

## 🔐 Security Checklist

Before going fully public:

- [ ] Generate new production wallet keys (not defaults!)
- [ ] Use production Transak API key
- [ ] Enable rate limiting (already configured)
- [ ] Set up Supabase RLS policies properly
- [ ] Add monitoring/logging (Render + Vercel have built-in)
- [ ] Review CORS allowed origins
- [ ] Consider adding authentication for sensitive endpoints
- [ ] Enable HTTPS only (automatic on Render + Vercel)

---

## 📊 Monitoring & Logs

### Backend Logs (Render)

1. Go to Render dashboard
2. Click your service
3. Go to **"Logs"** tab
4. Real-time logs appear here
5. Look for:
   - ✅ Supabase client initialized
   - 🌐 Allowed CORS origins
   - 🚀 MicroGate Backend running

### Frontend Logs (Vercel)

1. Go to Vercel dashboard
2. Click your project
3. Go to **"Deployments"** → Click latest
4. View build logs and function logs

### Analytics (Vercel)

1. Go to **"Analytics"** tab
2. See visitor stats, performance metrics
3. Monitor Web Vitals scores

---

## 🚀 Updating Your Deployment

### Push Updates

```bash
# Make changes locally
git add .
git commit -m "Update: description"
git push origin main

# Automatic deployments:
# - Vercel deploys on every push (instant)
# - Render deploys on every push (2-3 minutes)
```

### Rollback (if needed)

**Vercel:**
1. Go to Deployments tab
2. Find previous working deployment
3. Click "..." → "Promote to Production"

**Render:**
1. Go to service dashboard
2. Click "Manual Deploy" → Select previous commit

---

## 💰 Pricing Overview

### Free Tier Limits

**Render Free:**
- ✅ 750 hours/month (enough for 1 always-on service)
- ⚠️ Sleeps after 15 min inactivity
- ⚠️ 30-60 second cold start
- ✅ 512 MB RAM
- ✅ Auto SSL certificates

**Vercel Free:**
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ No cold starts
- ✅ Automatic SSL
- ✅ Global CDN

**Supabase Free:**
- ✅ 500 MB database
- ✅ 50,000 monthly active users
- ✅ 2 GB file storage
- ✅ Sufficient for testing

### Upgrade Path

When you need more:
- **Render Starter**: $7/month (no sleep, more resources)
- **Vercel Pro**: $20/month (more bandwidth, analytics)
- **Supabase Pro**: $25/month (8 GB database, better support)

---

## 📞 Support

**Render Help:**
- Docs: https://render.com/docs
- Community: https://community.render.com

**Vercel Help:**
- Docs: https://vercel.com/docs
- Discord: https://vercel.com/discord

**Your Project Issues:**
- GitHub: https://github.com/SathvikRaoR/microgate-project/issues

---

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ Frontend loads at `https://your-app.vercel.app`
2. ✅ Backend responds at `https://microgate-backend.onrender.com/api/health`
3. ✅ No CORS errors in browser console
4. ✅ Balance fetches from blockchain
5. ✅ Transaction history loads from Supabase
6. ✅ Theme toggle works and persists
7. ✅ Transak widget opens for funding
8. ✅ All fetch requests go to production backend

---

🎉 **Congratulations! Your MicroGate project is live on the web!**

Share your deployment URL and start accepting payments from AI agents! 🤖💰
