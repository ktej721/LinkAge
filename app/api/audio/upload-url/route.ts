import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getSession } from '@/lib/auth';

const BUCKET_NAME = 'request-audio';

// Ensure the storage bucket exists, create if missing
async function ensureBucketExists() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET_NAME);
  if (!exists) {
    console.log(`[audio-upload] Bucket "${BUCKET_NAME}" not found, creating...`);
    const { error } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: 52428800, // 50 MB
      allowedMimeTypes: ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg'],
    });
    if (error) {
      console.error(`[audio-upload] Failed to create bucket:`, error);
      throw new Error(`Could not create storage bucket: ${error.message}`);
    }
    console.log(`[audio-upload] Bucket "${BUCKET_NAME}" created successfully`);
  }
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== 'senior') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureBucketExists();

    const { filename } = await req.json();
    const path = `audio/${user.id}/${Date.now()}-${filename}`;

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(path);

    if (error) {
      console.error('Supabase audio storage error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl, token: data.token, path });
  } catch (err: any) {
    console.error('Audio upload URL route error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

