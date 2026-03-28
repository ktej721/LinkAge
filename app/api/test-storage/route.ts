import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    // Step 1: List existing buckets
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    console.log('[test-storage] Existing buckets:', JSON.stringify(buckets?.map(b => b.name)));
    if (listError) {
      console.error('[test-storage] List error:', listError);
      return NextResponse.json({ step: 'list', error: listError }, { status: 500 });
    }

    // Step 2: Try to create the bucket
    const bucketName = 'response-videos';
    const exists = buckets?.some(b => b.name === bucketName);
    
    if (!exists) {
      console.log('[test-storage] Creating bucket...');
      const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: false,
      });
      if (createError) {
        console.error('[test-storage] Create error:', JSON.stringify(createError));
        return NextResponse.json({ step: 'create', error: createError }, { status: 500 });
      }
      console.log('[test-storage] Bucket created!');
    } else {
      console.log('[test-storage] Bucket already exists');
    }

    // Step 3: Try to create a signed upload URL
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUploadUrl(`test/${Date.now()}-test.webm`);
    
    if (uploadError) {
      console.error('[test-storage] Upload URL error:', JSON.stringify(uploadError));
      return NextResponse.json({ step: 'upload-url', error: uploadError }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      buckets: buckets?.map(b => b.name),
      bucketExists: exists,
      hasSignedUrl: !!uploadData?.signedUrl,
      hasToken: !!uploadData?.token,
    });
  } catch (err: any) {
    console.error('[test-storage] Unexpected error:', err.message, err.stack);
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
