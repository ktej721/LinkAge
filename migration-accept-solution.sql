-- Migration: Senior Solution Acceptance + 24h Timeout
-- Run this in the Supabase SQL Editor

-- 1. Add expires_at to requests (24h from creation)
ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Backfill existing open requests with 24h from their created_at
UPDATE requests
  SET expires_at = created_at + INTERVAL '24 hours'
  WHERE expires_at IS NULL;

-- 2. Add accepted_by_senior flag to responses
ALTER TABLE responses
  ADD COLUMN IF NOT EXISTS accepted_by_senior BOOLEAN DEFAULT false;
