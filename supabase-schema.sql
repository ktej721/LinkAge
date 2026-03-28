-- LinkAge Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('senior', 'helper', 'owner')),
  phone TEXT,
  language_preference TEXT DEFAULT 'english',
  college_domain TEXT,
  college_name TEXT,
  is_email_verified BOOLEAN DEFAULT false,
  is_kyc_verified BOOLEAN DEFAULT false,
  profile_picture_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- OTP tokens table
CREATE TABLE IF NOT EXISTS otp_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  purpose TEXT DEFAULT 'login',
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Requests table
CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  senior_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  audio_url TEXT,
  language TEXT DEFAULT 'english',
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Responses table
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_url TEXT,
  text_content TEXT,
  response_type TEXT DEFAULT 'text' CHECK (response_type IN ('video', 'text', 'video_call')),
  is_approved BOOLEAN DEFAULT false,
  is_rejected BOOLEAN DEFAULT false,
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  is_kyc_response BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_otp_tokens_email ON otp_tokens(email);
CREATE INDEX IF NOT EXISTS idx_otp_tokens_email_used ON otp_tokens(email, used);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_requests_senior_id ON requests(senior_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_responses_request_id ON responses(request_id);
CREATE INDEX IF NOT EXISTS idx_responses_helper_id ON responses(helper_id);

-- Disable RLS for all tables (using service role key)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for service role access
CREATE POLICY "Service role has full access to users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to otp_tokens" ON otp_tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to user_sessions" ON user_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to requests" ON requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to responses" ON responses FOR ALL USING (true) WITH CHECK (true);
