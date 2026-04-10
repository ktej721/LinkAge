import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { awardPoints } from '@/lib/award-points';

// POST: Submit a response (helper only)
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== 'helper') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { request_id, video_url, text_content, response_type, call_url } = body;

  if (!request_id) {
    return NextResponse.json({ error: 'request_id is required.' }, { status: 400 });
  }

  // Check request exists, is open, and not expired
  const request = await prisma.request.findUnique({
    where: { id: request_id },
    select: { id: true, status: true, expires_at: true }
  });

  if (!request || request.status !== 'open') {
    return NextResponse.json({ error: 'Request not found or already closed.' }, { status: 404 });
  }

  if (request.expires_at && new Date(request.expires_at) < new Date()) {
    // Auto-close expired request
    await prisma.request.update({
      where: { id: request_id },
      data: { status: 'closed' }
    });
    return NextResponse.json({ error: 'This request has expired and is no longer accepting answers.' }, { status: 410 });
  }

  // All responses are stored. The senior decides which one to accept.
  // Video responses still need admin approval before the senior can see them.
  const is_approved = response_type === 'video' ? false : true;

  try {
    const data = await prisma.response.create({
      data: {
        request_id,
        helper_id: user.id,
        video_url,
        text_content,
        call_url: call_url || null,
        response_type: response_type || 'text',
        is_kyc_response: false,
        is_approved,
        is_rejected: false,
        accepted_by_senior: false,
      }
    });

    // Award points for submitting a response
    await awardPoints(user.id, 5, 'response_submitted', data.id);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
