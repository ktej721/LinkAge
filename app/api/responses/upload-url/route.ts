import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getSession } from '@/lib/auth';

// Get a signed upload URL for video upload to Supabase Storage
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== 'helper') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { filename, contentType } = await req.json();
  const path = `responses/${user.id}/${Date.now()}-${filename}`;

  const { data, error } = await supabaseAdmin.storage
    .from('response-videos')
    .createSignedUploadUrl(path);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, path });
}
