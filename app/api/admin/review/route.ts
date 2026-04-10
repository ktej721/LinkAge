import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { awardPoints } from '@/lib/award-points';
import { getSignedVideoUrl } from '@/lib/get-signed-url';

// GET: All pending video responses for review — with signed video URLs
export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await prisma.response.findMany({
    where: {
      is_approved: false,
      is_rejected: false,
      response_type: 'video'
    },
    include: {
      helper: { select: { id: true, name: true, email: true, college_name: true, college_domain: true } },
      request: {
        select: {
          id: true,
          title: true,
          description: true,
          language: true,
          senior: { select: { name: true } }
        }
      }
    },
    orderBy: { created_at: 'desc' }
  });

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
          signed_video = await getSignedVideoUrl(normalizedPath);
        } catch (err: any) {
          console.error(`[admin/review] Exception signing video for ${item.id}:`, err.message);
        }
        
        // If the first attempt failed, try the raw path as-is
        if (!signed_video && normalizedPath !== rawPath) {
          try {
            signed_video = await getSignedVideoUrl(rawPath);
          } catch (err: any) {
            console.error(`[admin/review] Fallback sign also failed for ${item.id}:`, err.message);
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

  try {
    const response = await prisma.response.update({
      where: { id: response_id },
      data: updateData,
      select: { request_id: true, helper_id: true }
    });

    // If approved, mark the request as answered
    if (action === 'approve') {
      await prisma.request.update({
        where: { id: response.request_id },
        data: { status: 'answered' }
      });

      // Award +15 points to helper for approved video response
      await awardPoints(response.helper_id, 15, 'response_approved', response_id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
