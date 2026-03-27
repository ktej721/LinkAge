import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getSession } from '@/lib/auth';

// GET: All pending video responses for review
export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('responses')
    .select(`
      *,
      helper:users!responses_helper_id_fkey(id, name, email, college_name, college_domain),
      request:requests(id, title, description, language, senior:users!requests_senior_id_fkey(name))
    `)
    .eq('is_approved', false)
    .eq('is_rejected', false)
    .eq('response_type', 'video')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST: Approve or reject a response
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { response_id, action, rejection_reason } = await req.json();

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  }

  const updateData: any = {
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  };

  if (action === 'approve') {
    updateData.is_approved = true;
    updateData.is_rejected = false;
  } else {
    updateData.is_rejected = true;
    updateData.is_approved = false;
    updateData.rejection_reason = rejection_reason || 'Does not meet quality standards.';
  }

  const { data: response, error } = await supabaseAdmin
    .from('responses')
    .update(updateData)
    .eq('id', response_id)
    .select('request_id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If approved, mark the request as answered
  if (action === 'approve') {
    await supabaseAdmin
      .from('requests')
      .update({ status: 'answered' })
      .eq('id', response.request_id);
  }

  return NextResponse.json({ success: true });
}
