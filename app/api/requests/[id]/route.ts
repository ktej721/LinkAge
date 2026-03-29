import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('requests')
    .select(`
      *,
      senior:users!requests_senior_id_fkey(id, name, language_preference, phone),
      responses(
        *,
        helper:users!responses_helper_id_fkey(id, name, college_name)
      )
    `)
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { status } = body;

  const { data, error } = await supabaseAdmin
    .from('requests')
    .update({ status })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
