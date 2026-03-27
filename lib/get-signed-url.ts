import { supabaseAdmin } from './supabase-server';

export async function getSignedVideoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.storage
    .from('response-videos')
    .createSignedUrl(path, 3600); // 1 hour expiry
  return data?.signedUrl || null;
}

export async function getSignedAudioUrl(path: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.storage
    .from('request-audio')
    .createSignedUrl(path, 3600);
  return data?.signedUrl || null;
}
