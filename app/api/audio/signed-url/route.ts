import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSignedAudioUrl } from '@/lib/get-signed-url';

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { path } = await req.json();
    if (!path) {
      return NextResponse.json({ error: 'path is required' }, { status: 400 });
    }

    const signedUrl = await getSignedAudioUrl(path);

    return NextResponse.json({ signedUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
