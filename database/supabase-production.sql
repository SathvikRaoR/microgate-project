-- ============================================================================
-- MicroGate Production Database Schema
-- Purpose: Anti-Replay Protection, Idempotency, Audit Trail
-- Platform: Supabase (PostgreSQL)
-- ============================================================================

-- ============================================================================
-- TABLE: transactions (Enhanced with Anti-Replay & Business Metrics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Transaction Identification
  tx_hash TEXT NOT NULL UNIQUE, -- Blockchain transaction hash (anti-replay key)
  agent_address TEXT NOT NULL,   -- Sender wallet address
  chain_id INTEGER NOT NULL DEFAULT 84532, -- Base Sepolia = 84532
  
  -- Payment Details
  amount NUMERIC(18, 6) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ETH', -- ETH or USDC
  
  -- Service Details
  service_endpoint TEXT NOT NULL, -- e.g., '/api/market-forecast'
  response_cached JSONB,          -- Cached API response (idempotency)
  
  -- Status & Verification
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed', 'replayed')),
  confirmations INTEGER DEFAULT 0,
  verified_at TIMESTAMPTZ,
  
  -- Business Metrics
  latency_ms INTEGER,             -- API response time
  client_ip TEXT,                 -- Rate limiting tracking
  user_agent TEXT,                -- Client identification
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES: Optimized for Anti-Replay Lookup & Analytics
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_agent_address ON transactions(agent_address);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_chain_id ON transactions(chain_id);
CREATE INDEX IF NOT EXISTS idx_transactions_service_endpoint ON transactions(service_endpoint);

-- ============================================================================
-- TRIGGER: Auto-Update Timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow backend service role to perform all operations
CREATE POLICY "Service role full access"
  ON transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Public users can only read their own transactions
CREATE POLICY "Users read own transactions"
  ON transactions
  FOR SELECT
  TO anon, authenticated
  USING (agent_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- ============================================================================
-- TABLE: api_usage_stats (Real-Time Business Metrics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Time Buckets (for aggregation)
  hour_bucket TIMESTAMPTZ NOT NULL,
  
  -- Metrics
  total_calls INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,
  total_volume_eth NUMERIC(18, 6) DEFAULT 0,
  total_volume_usdc NUMERIC(18, 6) DEFAULT 0,
  avg_latency_ms INTEGER DEFAULT 0,
  unique_agents INTEGER DEFAULT 0,
  
  -- Traditional Payment Comparison
  stripe_cost_usd NUMERIC(10, 2) DEFAULT 0, -- 2.9% + $0.30 per txn
  savings_usd NUMERIC(10, 2) DEFAULT 0,     -- Cost saved vs Stripe
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one row per hour
  UNIQUE(hour_bucket)
);

CREATE INDEX IF NOT EXISTS idx_api_usage_stats_hour_bucket ON api_usage_stats(hour_bucket DESC);

-- ============================================================================
-- VIEW: live_dashboard_metrics (Aggregated Stats for Frontend)
-- ============================================================================
CREATE OR REPLACE VIEW live_dashboard_metrics AS
SELECT
  COUNT(*) AS total_api_calls,
  COUNT(DISTINCT agent_address) AS unique_agents,
  SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS successful_calls,
  SUM(CASE WHEN status = 'failed' OR status = 'replayed' THEN 1 ELSE 0 END) AS failed_calls,
  COALESCE(SUM(CASE WHEN currency = 'ETH' THEN amount ELSE 0 END), 0) AS total_volume_eth,
  COALESCE(SUM(CASE WHEN currency = 'USDC' THEN amount ELSE 0 END), 0) AS total_volume_usdc,
  COALESCE(AVG(latency_ms), 0)::INTEGER AS avg_latency_ms,
  MAX(created_at) AS last_transaction_at,
  
  -- Calculate Stripe equivalent cost (2.9% + $0.30 per transaction)
  -- Assume 1 ETH = $2000 for calculation
  ROUND(
    (COUNT(CASE WHEN status = 'confirmed' THEN 1 END) * 0.30) + 
    (SUM(CASE WHEN status = 'confirmed' AND currency = 'ETH' THEN amount * 2000 * 0.029 ELSE 0 END)),
    2
  ) AS stripe_equivalent_cost_usd,
  
  -- MicroGate cost (only gas fees, ~$0.01 per tx on Base)
  ROUND(COUNT(CASE WHEN status = 'confirmed' THEN 1 END) * 0.01, 2) AS microgate_cost_usd,
  
  -- Savings
  ROUND(
    (COUNT(CASE WHEN status = 'confirmed' THEN 1 END) * 0.30) + 
    (SUM(CASE WHEN status = 'confirmed' AND currency = 'ETH' THEN amount * 2000 * 0.029 ELSE 0 END)) -
    (COUNT(CASE WHEN status = 'confirmed' THEN 1 END) * 0.01),
    2
  ) AS total_savings_usd

FROM transactions
WHERE created_at > NOW() - INTERVAL '30 days';

-- Grant access to view
GRANT SELECT ON live_dashboard_metrics TO anon, authenticated, service_role;

-- ============================================================================
-- FUNCTION: check_replay_attack (Anti-Replay Protection)
-- ============================================================================
CREATE OR REPLACE FUNCTION check_replay_attack(p_tx_hash TEXT)
RETURNS TABLE(is_replay BOOLEAN, existing_response JSONB) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (COUNT(*) > 0)::BOOLEAN AS is_replay,
    MAX(response_cached) AS existing_response
  FROM transactions
  WHERE tx_hash = p_tx_hash;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA: Sample for Testing
-- ============================================================================
-- (Optional) Insert a test transaction for development
-- INSERT INTO transactions (
--   tx_hash, agent_address, chain_id, amount, currency, 
--   service_endpoint, status, confirmations
-- ) VALUES (
--   '0x0000000000000000000000000000000000000000000000000000000000000000',
--   '0x0000000000000000000000000000000000000000',
--   84532, 0.001, 'ETH', '/api/market-forecast', 'confirmed', 2
-- );

-- ============================================================================
-- VERIFICATION QUERIES (Run these after setup to verify)
-- ============================================================================
-- SELECT * FROM transactions LIMIT 10;
-- SELECT * FROM live_dashboard_metrics;
-- SELECT * FROM check_replay_attack('0xabc123...');

COMMENT ON TABLE transactions IS 'Anti-replay protected transaction ledger with cached responses for idempotency';
COMMENT ON TABLE api_usage_stats IS 'Time-series business metrics for dashboard analytics';
COMMENT ON VIEW live_dashboard_metrics IS 'Real-time aggregated metrics for frontend dashboard';
COMMENT ON FUNCTION check_replay_attack IS 'Returns TRUE if tx_hash already exists (replay attack detected)';
