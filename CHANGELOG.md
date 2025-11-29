# Changelog

All notable changes to the MicroGate project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0] - 2025-11-29

### 🎉 Major Refactor - Interview-Ready Codebase

#### Added
- **5-Step Validation Chain** for `/api/premium-data` endpoint
  - Chain ID verification (Base Sepolia 84532)
  - Recipient address validation
  - Payment amount check (≥ 0.0001 ETH)
  - Transaction status verification
  - Replay attack protection with Supabase
- **Automated Testing Suite** with Jest and Supertest
  - 23 comprehensive test cases
  - Health check, market sentiment, premium data, and security tests
  - Performance benchmarks
- **CI/CD Pipeline** with GitHub Actions
  - Automated testing on Node.js 18.x and 20.x
  - Security audits
  - Test results artifacts
- **Crypto Market Sentiment API** (`/api/market-sentiment`)
  - Realistic ETH price data ($3350-$3550 range)
  - Sentiment indicators (Bullish/Bearish/Neutral)
  - Volatility metrics (Low/Medium/High)
- **Closeable Error Popups** with × button
  - Hover effects and smooth animations
  - Multi-line error message support
- **Professional Documentation**
  - Comprehensive README with security architecture
  - API documentation with all endpoints
  - Testing guide
  - Configuration examples

#### Changed
- **Renamed endpoint**: `/api/secret` → `/api/premium-data`
- **Updated agent.js**: Now uses correct `/api/premium-data` endpoint
- **Reduced balance requirement**: From 1.5x to payment + 0.00005 ETH gas buffer
- **Transak configuration**:
  - Changed default crypto: USDC → ETH
  - Changed fiat currency: INR → USD
  - Removed hardcoded payment method
- **Package.json**: Updated to v4.0.0 with proper metadata
- **Environment examples**: Updated with security warnings
- **Mock transaction amounts**: 0.01 USDC → 0.0001 ETH

#### Removed
- **Unused function**: `validatePayment()` (replaced by inline validation)
- **USDC contract references**: Simplified to ETH-only
- **Unused imports**: ActivityLog, StatusFooter from App.jsx
- **Unused components**: ActivityLog.jsx, StatusFooter.jsx, MatrixActivityLog.jsx, LiveStatsCard.jsx
- **Outdated documentation**: 15 obsolete .md files removed
- **Utility scripts**: test.js, setup.js, run.js (replaced by proper test suite)
- **Development console.logs**: Cleaned from main.jsx

#### Fixed
- **Agent endpoint mismatch**: Now correctly calls `/api/premium-data`
- **Balance check error**: Agent now passes with 0.0007 ETH
- **Transak API key format**: Fixed from base64 to UUID format
- **Error popup UX**: Added close button functionality
- **Window.innerWidth crash**: Fixed with React useState pattern
- **Response handling**: Updated for new API structure with nested data

#### Security
- **Replay attack prevention**: Transaction hashes stored in Supabase
- **5-step validation**: Comprehensive payment verification
- **Input validation**: Strict format checking for all inputs
- **Rate limiting**: 5 requests/minute per IP
- **Environment variables**: All secrets in .env files

### Documentation
- README rebranded as "Developer-Ready Prototype"
- Added detailed 5-step validation architecture
- Updated live demo links (Vercel + Render)
- Added API key security warnings
- Comprehensive testing documentation

### Technical Debt Addressed
- Removed all dead code and unused functions
- Cleaned up inconsistent naming conventions
- Updated all dependencies references
- Standardized error handling
- Removed contradictory code paths

---

## [3.5.0] - 2025-11-28

### Added
- Activity Log Monitor with terminal-style display
- PDF Invoice Generator for transactions
- System Status Footer with health monitoring
- Enhanced UI/UX with glassmorphism design

---

## [3.0.0] - 2025-11-27

### Added
- Supabase database integration
- Transaction history tracking
- BaseScan blockchain explorer links
- Real-time transaction logging

---

## [2.0.0] - 2025-11-26

### Added
- Golden ratio UI design
- Light/dark theme toggle
- Auto-refresh balance (30 seconds)
- Network status monitoring

### Fixed
- Blank screen issue (removed wagmi dependency)
- Improved error handling

---

## [1.0.0] - 2025-11-25

### Initial Release
- x402 Payment Protocol implementation
- AI agent autonomous payment system
- Base Sepolia testnet integration
- Express backend API
- React frontend dashboard
- Transak payment integration
- Viem blockchain library integration

---

## Types of Changes
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements
