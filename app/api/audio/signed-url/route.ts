import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getSession } from '@/lib/auth';

// POST: Get a signed URL for an audio file in request-audio bucket
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { path } = await req.json();
    if (!path) {
      return NextResponse.json({ error: 'path is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.storage
      .from('request-audio')
      .createSignedUrl(path, 3600); // 1 hour

    if (error) {
      console.error('[audio/signed-url] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data?.signedUrl || null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
