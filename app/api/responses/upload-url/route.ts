import { NextRequest, NextResponse } from 'next/server';
import { s3 } from '@/lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getSession } from '@/lib/auth';

const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'linkage-storage';

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

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== 'helper') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { filename, contentType } = await req.json();
    
    const resolvedContentType = getContentType(filename || 'response.webm', contentType);
    
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

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: path,
      ContentType: resolvedContentType,
    });
    
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return NextResponse.json({
      signedUrl,
      path,
      contentType: resolvedContentType,
    });
  } catch (err: any) {
    console.error('[upload-url] Route error:', err.message);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
