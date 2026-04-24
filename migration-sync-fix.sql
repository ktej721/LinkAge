-- Migration: Senior-Helper Sync Fix
-- Run this in the Supabase SQL Editor to ensure all required columns exist.

-- 1. Add expires_at to requests (if not already present from previous migration)
ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Backfill existing open requests with 24h from their created_at
UPDATE requests
  SET expires_at = created_at + INTERVAL '24 hours'
  WHERE expires_at IS NULL;

-- 2. Add accepted_by_senior flag to responses (if not already present)
ALTER TABLE responses
  ADD COLUMN IF NOT EXISTS accepted_by_senior BOOLEAN DEFAULT false;

-- 3. Add call_url column to responses (used by video_call response type)
ALTER TABLE responses
  ADD COLUMN IF NOT EXISTS call_url TEXT;

-- 4. Fix any existing text responses that are approved but their parent request
--    is still stuck on 'open' — transition them to 'answered'
UPDATE requests
  SET status = 'answered'
  WHERE status = 'open'
    AND id IN (
      SELECT DISTINCT request_id
      FROM responses
      WHERE is_approved = true
        AND is_rejected = false
    );
