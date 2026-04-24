import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-server';
import { User } from '@/types';

export async function getSession(): Promise<User | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('linkage_session')?.value;
  if (!token) return null;

  const { data: session, error } = await supabaseAdmin
    .from('user_sessions')
    .select('*, user:users(*)')
    .eq('session_token', token)
    .maybeSingle();

  if (error || !session || new Date(session.expires_at) < new Date()) {
    return null;
  }

  return session.user as unknown as User;
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID() + '-' + crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(); // 10 years

  await supabaseAdmin.from('user_sessions').insert({
    user_id: userId,
    session_token: token,
    expires_at: expiresAt,
  });

  return token;
}

export async function deleteSession(token: string): Promise<void> {
  await supabaseAdmin
    .from('user_sessions')
    .delete()
    .eq('session_token', token);
}
