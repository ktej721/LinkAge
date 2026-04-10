import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
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

    const conditions: any = {
      response_type: 'video_call',
      call_url: { not: null }
    };

    if (requestIds.length > 0) {
      conditions.request_id = { in: requestIds };
    }

    const response = await prisma.response.findFirst({
      where: conditions,
      include: {
        helper: { select: { name: true } },
        request: { select: { title: true } }
      },
      orderBy: { created_at: 'desc' }
    });

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
