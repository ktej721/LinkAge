import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET: Fetch requests (filtered by role)
export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const language = searchParams.get('language');
  const status = searchParams.get('status') || 'open';

  const conditions: any = {};
  
  if (user.role === 'senior') {
    conditions.senior_id = user.id;
  } else if (user.role === 'helper') {
    conditions.status = 'open';
    if (language) conditions.language = language;
  }

  try {
    const data = await prisma.request.findMany({
      where: conditions,
      include: {
        senior: { select: { id: true, name: true, language_preference: true } },
        responses: { select: { id: true, is_approved: true, response_type: true, call_url: true } }
      },
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
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

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  try {
    const data = await prisma.request.create({
      data: {
        senior_id: user.id,
        title,
        description,
        audio_url,
        language: language || user.language_preference || 'english',
        category: category || 'general',
        status: 'open',
        expires_at: expiresAt,
      }
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
