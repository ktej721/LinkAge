import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { User } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getSession(): Promise<User | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('linkage_session')?.value;
  if (!token) return null;

  const { data: session } = await supabase
    .from('user_sessions')
    .select('*, user:users(*)')
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!session) return null;
  return session.user as User;
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID() + '-' + crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  await supabase.from('user_sessions').insert({
    user_id: userId,
    session_token: token,
    expires_at: expiresAt,
  });
  
  return token;
}

export async function deleteSession(token: string): Promise<void> {
  await supabase.from('user_sessions').delete().eq('session_token', token);
}
