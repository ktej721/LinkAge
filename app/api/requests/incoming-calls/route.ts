import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== 'senior') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const requestIdsStr = searchParams.get('requestIds');
    let requestIds: string[] = [];
    if (requestIdsStr) {
      requestIds = requestIdsStr.split(',');
    }

    let query = supabaseAdmin
      .from('responses')
      .select(`
        *,
        helper:users!responses_helper_id_fkey(name),
        request:requests!responses_request_id_fkey(title)
      `)
      .eq('response_type', 'video_call')
      .not('call_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (requestIds.length > 0) {
      query = query.in('request_id', requestIds);
    }

    const { data: response, error } = await query.maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (!response) {
      return NextResponse.json({ call: null });
    }

    // Only return calls created in the last 60 seconds
    const createdAt = new Date(response.created_at).getTime();
    const now = new Date().getTime();
    if (now - createdAt > 60000) {
      return NextResponse.json({ call: null });
    }

    return NextResponse.json({
      call: {
        callUrl: response.call_url,
        helperName: response.helper?.name || 'A helper',
        requestTitle: response.request?.title || 'your question',
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
