import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getSession } from '@/lib/auth';

const BUCKET_NAME = 'response-videos';
let bucketChecked = false;

// Ensure the storage bucket exists, create if missing
async function ensureBucketExists() {
  if (bucketChecked) return; // Only check once per server lifecycle
  
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === BUCKET_NAME);
    if (!exists) {
      console.log(`[upload-url] Bucket "${BUCKET_NAME}" not found, creating...`);
      const { error } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 104857600, // 100 MB
        allowedMimeTypes: [
          'video/webm',
          'video/mp4',
          'video/quicktime',
          'video/x-msvideo',
          'video/x-matroska',
          'video/ogg',
          'video/mpeg',
          'application/octet-stream', // fallback for some browsers
        ],
      });
      if (error && !error.message?.includes('already exists')) {
        console.error(`[upload-url] Failed to create bucket:`, error);
        throw new Error(`Could not create storage bucket: ${error.message}`);
      }
      console.log(`[upload-url] Bucket "${BUCKET_NAME}" created successfully`);
    }
    bucketChecked = true;
  } catch (err: any) {
    console.error('[upload-url] ensureBucketExists error:', err.message);
    // Don't throw - try the upload anyway, maybe the bucket exists but listBuckets failed
  }
}

// Map file extensions to proper MIME types
function getContentType(filename: string, providedContentType?: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    'webm': 'video/webm',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'mkv': 'video/x-matroska',
    'ogg': 'video/ogg',
    'mpeg': 'video/mpeg',
    'mpg': 'video/mpeg',
  };
  
  if (ext && mimeMap[ext]) return mimeMap[ext];
  if (providedContentType && providedContentType !== 'application/octet-stream') return providedContentType;
  return 'video/webm'; // default fallback
}

// Get a signed upload URL for video upload to Supabase Storage
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== 'helper') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Auto-create bucket if it doesn't exist
    await ensureBucketExists();

    const { filename, contentType } = await req.json();
    
    // Determine proper content type from filename
    const resolvedContentType = getContentType(filename || 'response.webm', contentType);
    
    // Use a consistent extension based on the actual content type
    const extMap: Record<string, string> = {
      'video/webm': 'webm',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
      'video/x-msvideo': 'avi',
      'video/x-matroska': 'mkv',
      'video/ogg': 'ogg',
      'video/mpeg': 'mpeg',
    };
    const ext = extMap[resolvedContentType] || 'webm';
    const safeName = (filename || 'response').replace(/\.[^.]+$/, '');
    const path = `responses/${user.id}/${Date.now()}-${safeName}.${ext}`;

    console.log(`[upload-url] Generating signed URL for path: ${path}, contentType: ${resolvedContentType}`);

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(path);

    if (error) {
      console.error('[upload-url] Supabase storage error:', JSON.stringify(error));
      return NextResponse.json({ error: `Storage error: ${error.message}` }, { status: 500 });
    }

    if (!data?.signedUrl) {
      console.error('[upload-url] No signed URL returned from Supabase');
      return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
    }

    console.log('[upload-url] Signed URL generated successfully');
    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path,
      contentType: resolvedContentType,
    });
  } catch (err: any) {
    console.error('[upload-url] Route error:', err.message);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
