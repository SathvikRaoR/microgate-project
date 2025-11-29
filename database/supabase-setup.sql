-- MicroGate Transactions Table Schema
-- Run this in Supabase SQL Editor

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_address TEXT NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  amount NUMERIC(18, 6) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_transactions_agent_address ON transactions(agent_address);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_status ON transactions(status);

-- Enable Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access (adjust based on your auth needs)
CREATE POLICY "Allow public read access" ON transactions
  FOR SELECT
  USING (true);

-- Create policy to allow insert from backend (requires service role key)
CREATE POLICY "Allow service role insert" ON transactions
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow update from backend
CREATE POLICY "Allow service role update" ON transactions
  FOR UPDATE
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for recent transactions
CREATE OR REPLACE VIEW recent_transactions AS
SELECT 
  id,
  agent_address,
  tx_hash,
  amount,
  status,
  created_at,
  updated_at
FROM transactions
ORDER BY created_at DESC
LIMIT 100;

COMMENT ON TABLE transactions IS 'Tracks all AI Agent payment transactions on Base Sepolia';
COMMENT ON COLUMN transactions.agent_address IS 'Ethereum address of the agent wallet';
COMMENT ON COLUMN transactions.tx_hash IS 'Blockchain transaction hash';
COMMENT ON COLUMN transactions.amount IS 'Transaction amount in ETH';
COMMENT ON COLUMN transactions.status IS 'Transaction status: pending, confirmed, or failed';
