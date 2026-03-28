-- ============================================
-- LinkAge — Helper Password Auth Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add password_hash column to users table (nullable — seniors don't have passwords)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);

-- RLS
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on password_reset_tokens"
  ON password_reset_tokens FOR ALL
  USING (true)
  WITH CHECK (true);
