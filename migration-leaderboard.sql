-- ============================================
-- LinkAge Leaderboard & Points System Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Helper Points table — stores every point event
CREATE TABLE IF NOT EXISTS helper_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  helper_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INT NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_helper_points_helper_id ON helper_points(helper_id);
CREATE INDEX IF NOT EXISTS idx_helper_points_reason ON helper_points(reason);
CREATE INDEX IF NOT EXISTS idx_helper_points_created_at ON helper_points(created_at);

-- 2. Helper Streaks table — tracks daily activity streaks
CREATE TABLE IF NOT EXISTS helper_streaks (
  helper_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  last_active_date DATE,
  longest_streak INT DEFAULT 0
);

-- 3. Enable RLS (Row Level Security) but allow service role full access
ALTER TABLE helper_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE helper_streaks ENABLE ROW LEVEL SECURITY;

-- Policy: service role can do everything (supabaseAdmin uses service role key)
CREATE POLICY "Service role full access on helper_points"
  ON helper_points FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on helper_streaks"
  ON helper_streaks FOR ALL
  USING (true)
  WITH CHECK (true);
