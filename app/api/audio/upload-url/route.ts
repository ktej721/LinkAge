import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== 'senior') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { filename } = await req.json();
  const path = `audio/${user.id}/${Date.now()}-${filename}`;

  const { data, error } = await supabaseAdmin.storage
    .from('request-audio')
    .createSignedUploadUrl(path);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, path });
}
