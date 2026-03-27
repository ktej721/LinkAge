import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getSession } from '@/lib/auth';

// POST: Submit a response (helper only)
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== 'helper') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { request_id, video_url, text_content, response_type } = body;

  if (!request_id) {
    return NextResponse.json({ error: 'request_id is required.' }, { status: 400 });
  }

  // Check request exists and is open
  const { data: request } = await supabaseAdmin
    .from('requests')
    .select('id, status')
    .eq('id', request_id)
    .single();

  if (!request || request.status !== 'open') {
    return NextResponse.json({ error: 'Request not found or already answered.' }, { status: 404 });
  }

  // KYC helpers: auto-approved if it's a text/call response
  const is_kyc_response = user.is_kyc_verified;
  const is_approved = is_kyc_response && response_type === 'text';

  const { data, error } = await supabaseAdmin.from('responses').insert({
    request_id,
    helper_id: user.id,
    video_url,
    text_content,
    response_type,
    is_kyc_response,
    is_approved,
    is_rejected: false,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If auto-approved, mark request as answered
  if (is_approved) {
    await supabaseAdmin
      .from('requests')
      .update({ status: 'answered' })
      .eq('id', request_id);
  }

  return NextResponse.json({ data }, { status: 201 });
}
