# 🚀 Quick Deployment Checklist

## Pre-Deployment

- [ ] Code is committed and pushed to GitHub
- [ ] Supabase project created and SQL schema run
- [ ] Have Supabase URL and service_role key ready

## Part 1: Backend (Render.com)

### Setup
- [ ] Create Render account with GitHub
- [ ] Create New Web Service
- [ ] Connect `microgate-project` repository

### Configuration
- [ ] Set Root Directory to: **`backend`**
- [ ] Set Build Command to: **`npm install`**
- [ ] Set Start Command to: **`npm start`**
- [ ] Set Runtime to: **Node**

### Environment Variables (10 variables)
- [ ] `PORT` = `3000`
- [ ] `NODE_ENV` = `production`
- [ ] `PRIVATE_KEY` = `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- [ ] `WALLET_ADDRESS` = `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- [ ] `RPC_URL` = `https://sepolia.base.org`
- [ ] `USDC_CONTRACT` = `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- [ ] `SUPABASE_URL` = Your Supabase project URL
- [ ] `SUPABASE_KEY` = Your service_role key
- [ ] `FRONTEND_URL` = (Leave empty, add after Vercel deployment)

### Deploy & Test
- [ ] Click "Create Web Service"
- [ ] Wait for deployment (2-5 min)
- [ ] Copy backend URL (e.g., `https://microgate-backend.onrender.com`)
- [ ] Test: `curl https://your-backend.onrender.com/api/health`
- [ ] Should return JSON with `"status": "ok"`

---

## Part 2: Frontend (Vercel.com)

### Setup
- [ ] Create Vercel account with GitHub
- [ ] Click "Add New Project"
- [ ] Import `microgate-project` repository

### Configuration
- [ ] Set Root Directory to: **`frontend`** (Click Edit)
- [ ] Framework Preset: **Vite** (auto-detected)
- [ ] Build Command: **`npm run build`** (auto-detected)
- [ ] Output Directory: **`dist`** (auto-detected)

### Environment Variables (5 variables)
- [ ] `VITE_BACKEND_URL` = Your Render backend URL
- [ ] `VITE_AGENT_WALLET_ADDRESS` = `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- [ ] `VITE_RPC_URL` = `https://sepolia.base.org`
- [ ] `VITE_TRANSAK_API_KEY` = `3fd3ee4e-dd3c-49be-89bc-7bd527402ddf`
- [ ] `VITE_TRANSAK_ENV` = `STAGING`

### Deploy & Test
- [ ] Click "Deploy"
- [ ] Wait for build (1-3 min)
- [ ] Copy frontend URL (e.g., `https://microgate-app.vercel.app`)
- [ ] Visit URL in browser
- [ ] Dashboard should load and display UI

---

## Part 3: Connect Frontend & Backend

### Update Backend CORS
- [ ] Go to Render dashboard
- [ ] Click your backend service
- [ ] Go to "Environment" tab
- [ ] Add/update `FRONTEND_URL` with your Vercel URL
- [ ] Save (backend will redeploy automatically)

### Test Connection
- [ ] Open your Vercel URL in browser
- [ ] Open DevTools Console (F12)
- [ ] Look for: "🔧 MicroGate Config: {...}"
- [ ] No CORS errors should appear
- [ ] Balance should load from blockchain
- [ ] Transaction history should fetch from backend

---

## Verification Tests

### Backend Tests
- [ ] Health endpoint returns 200 OK
- [ ] Transactions endpoint returns JSON
- [ ] CORS logs show both localhost and Vercel URL
- [ ] Supabase connection confirmed in logs

### Frontend Tests
- [ ] Dashboard loads without errors
- [ ] Agent balance displays correctly
- [ ] Theme toggle works
- [ ] Transaction history table appears
- [ ] Network status shows 🟢 Connected
- [ ] No console errors

### Integration Tests
- [ ] Click "Activate Agent" (if wallet funded)
- [ ] Transaction should complete
- [ ] New transaction appears in history
- [ ] BaseScan link works
- [ ] Balance updates automatically

---

## URLs to Save

### Your Deployment URLs:

**Backend:**
- URL: `https://_____________________________.onrender.com`
- Health: `https://_____________________________.onrender.com/api/health`
- Transactions: `https://_____________________________.onrender.com/api/transactions`

**Frontend:**
- URL: `https://_____________________________.vercel.app`
- Dashboard: `https://_____________________________.vercel.app`

**Supabase:**
- URL: `https://_____________________________.supabase.co`
- Dashboard: `https://app.supabase.com/project/_____________________`

---

## Common Issues

### ❌ "Failed to fetch" error
**Solution**: Check `VITE_BACKEND_URL` in Vercel matches Render URL

### ❌ CORS error in console
**Solution**: Update `FRONTEND_URL` in Render to match Vercel URL exactly (no trailing slash)

### ❌ Backend 503 error
**Solution**: Free tier sleeps after 15 min. First request takes 30-60s to wake up.

### ❌ Build fails on Render
**Solution**: Verify Root Directory is set to `backend` (not empty or `/`)

### ❌ Build fails on Vercel
**Solution**: Verify Root Directory is set to `frontend` (not empty or `/`)

### ❌ Balance not loading
**Solution**: Check `VITE_RPC_URL` is set correctly in Vercel

---

## 🎉 Success!

When all checkboxes are ✅ and tests pass, your MicroGate project is live!

**Share your deployment:**
- Frontend URL: ___________________________________
- GitHub Repo: https://github.com/SathvikRaoR/microgate-project

---

**Estimated Time**: 15-20 minutes total
**Cost**: $0 (using free tiers)
**Next Steps**: See DEPLOYMENT.md for custom domains, monitoring, and production optimization
