import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getSession } from '@/lib/auth';
import { awardPoints } from '@/lib/award-points';

// POST: Senior accepts a specific response as the solution
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSession();
  if (!user || user.role !== 'senior') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { response_id } = await req.json();
  if (!response_id) {
    return NextResponse.json({ error: 'response_id is required.' }, { status: 400 });
  }

  const requestId = params.id;

  // Verify the request belongs to this senior and is not closed
  const { data: request, error: reqErr } = await supabaseAdmin
    .from('requests')
    .select('id, senior_id, status, expires_at')
    .eq('id', requestId)
    .maybeSingle();

  if (reqErr || !request) {
    return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
  }
  if (request.senior_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }
  if (request.status === 'closed') {
    return NextResponse.json({ error: 'Request is already closed.' }, { status: 409 });
  }

  // Verify the response belongs to this request
  const { data: response, error: respErr } = await supabaseAdmin
    .from('responses')
    .select('id, request_id, helper_id, is_approved')
    .eq('id', response_id)
    .eq('request_id', requestId)
    .maybeSingle();

  if (respErr || !response) {
    return NextResponse.json({ error: 'Response not found for this request.' }, { status: 404 });
  }
  if (!response.is_approved) {
    return NextResponse.json({ error: 'This response is still under review and cannot be accepted yet.' }, { status: 422 });
  }

  // Clear any previous accepted_by_senior flags for this request (safety)
  await supabaseAdmin
    .from('responses')
    .update({ accepted_by_senior: false })
    .eq('request_id', requestId);

  // Mark the chosen response as accepted
  const { error: acceptErr } = await supabaseAdmin
    .from('responses')
    .update({ accepted_by_senior: true })
    .eq('id', response_id);

  if (acceptErr) {
    return NextResponse.json({ error: acceptErr.message }, { status: 500 });
  }

  // Close the request
  await supabaseAdmin
    .from('requests')
    .update({ status: 'closed' })
    .eq('id', requestId);

  // Award 50 points to the helper whose response was accepted
  await awardPoints(response.helper_id, 50, 'accepted_by_senior', response_id);

  return NextResponse.json({ success: true, message: 'Solution accepted! Request is now closed.' });
}
