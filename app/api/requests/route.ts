import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getSession } from '@/lib/auth';

// GET: Fetch requests (filtered by role)
export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const language = searchParams.get('language');
  const status = searchParams.get('status') || 'open';

  let query = supabaseAdmin
    .from('requests')
    .select(`
      *,
      senior:users!requests_senior_id_fkey(id, name, language_preference),
      responses(id, is_approved, response_type, call_url)
    `)
    .order('created_at', { ascending: false });

  // Seniors see only their own requests
  if (user.role === 'senior') {
    query = query.eq('senior_id', user.id);
  } else if (user.role === 'helper') {
    // Helpers see open requests; optionally filter by language
    query = query.eq('status', 'open');
    if (language) query = query.eq('language', language);
  }
  // Owners see everything

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST: Create new request (senior only)
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== 'senior') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, audio_url, language, category } = body;

  if (!title || !description) {
    return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 });
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin.from('requests').insert({
    senior_id: user.id,
    title,
    description,
    audio_url,
    language: language || user.language_preference,
    category: category || 'general',
    status: 'open',
    expires_at: expiresAt,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
