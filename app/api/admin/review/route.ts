import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getSession } from '@/lib/auth';

// GET: All pending video responses for review — with signed video URLs
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

  // Generate signed URLs server-side using the service role key
  const enhanced = await Promise.all(
    (data || []).map(async (item: any) => {
      let signed_video: string | null = null;
      if (item.video_url) {
        // Normalize the path — remove any leading slash
        const rawPath = item.video_url;
        const normalizedPath = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;
        
        console.log(`[admin/review] Generating signed URL for response ${item.id}, video_url: "${rawPath}", normalized: "${normalizedPath}"`);
        
        // Try the normalized path first
        try {
          const { data: urlData, error: signError } = await supabaseAdmin.storage
            .from('response-videos')
            .createSignedUrl(normalizedPath, 3600); // 1 hour expiry
          
          if (signError) {
            console.error(`[admin/review] Sign error for "${normalizedPath}":`, signError.message);
          } else {
            signed_video = urlData?.signedUrl || null;
          }
        } catch (err: any) {
          console.error(`[admin/review] Exception signing video for ${item.id}:`, err.message);
        }
        
        // If the first attempt failed, try the raw path as-is (in case it was stored differently)
        if (!signed_video && normalizedPath !== rawPath) {
          try {
            const { data: urlData2 } = await supabaseAdmin.storage
              .from('response-videos')
              .createSignedUrl(rawPath, 3600);
            signed_video = urlData2?.signedUrl || null;
          } catch (err: any) {
            console.error(`[admin/review] Fallback sign also failed for ${item.id}:`, err.message);
          }
        }
        
        // If still null, try listing to see if file exists
        if (!signed_video) {
          // Extract folder and file from path
          const lastSlash = normalizedPath.lastIndexOf('/');
          if (lastSlash > 0) {
            const folder = normalizedPath.substring(0, lastSlash);
            const fileName = normalizedPath.substring(lastSlash + 1);
            const { data: listData } = await supabaseAdmin.storage
              .from('response-videos')
              .list(folder, { limit: 10 });
            console.log(`[admin/review] Files in "${folder}":`, listData?.map(f => f.name) || 'none');
          }
        }
        
        console.log(`[admin/review] Result for ${item.id}: signed_video=${signed_video ? 'OK' : 'NULL'}`);
      }
      return { ...item, signed_video };
    })
  );

  return NextResponse.json({ data: enhanced });
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
