export type UserRole = 'senior' | 'helper' | 'owner';
export type RequestStatus = 'open' | 'answered' | 'closed';
export type ResponseType = 'video' | 'text' | 'video_call';
export type Language = 'english' | 'hindi' | 'tamil' | 'telugu' | 'kannada' | 'malayalam' | 'marathi' | 'bengali';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  language_preference: Language;
  college_domain?: string;
  college_name?: string;
  is_email_verified: boolean;
  is_kyc_verified: boolean;
  profile_picture_url?: string;
  created_at: string;
}

export interface Request {
  id: string;
  senior_id: string;
  title: string;
  description: string;
  audio_url?: string;
  language: Language;
  category: string;
  status: RequestStatus;
  expires_at?: string;
  created_at: string;
  senior?: User;
  responses?: Response[];
}

export interface Response {
  id: string;
  request_id: string;
  helper_id: string;
  video_url?: string;
  text_content?: string;
  call_url?: string;
  response_type: ResponseType;
  is_approved: boolean;
  is_rejected: boolean;
  accepted_by_senior: boolean;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  is_kyc_response: boolean;
  created_at: string;
  helper?: User;
  request?: Request;
}

export interface Session {
  user: User;
  session_token: string;
}

// Leaderboard & Points System Types
export type HelperTier = 'Seedling' | 'Helper' | 'Star' | 'Champion' | 'Legend';

export interface HelperPointEvent {
  id: string;
  helper_id: string;
  points: number;
  reason: string;
  reference_id?: string;
  created_at: string;
}

export interface HelperLeaderboardEntry {
  rank: number;
  helper_id: string;
  name: string;
  college_name?: string;
  college_domain?: string;
  total_points: number;
  accepted_count: number;
  response_count: number;
  tier: HelperTier;
  streak: number;
  profile_picture_url?: string;
}

export interface HelperStreak {
  helper_id: string;
  current_streak: number;
  last_active_date: string;
  longest_streak: number;
}
