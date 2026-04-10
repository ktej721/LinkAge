import { s3 } from '@/lib/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'linkage-storage';

export async function getSignedVideoUrl(path: string): Promise<string | null> {
  try {
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: path });
    return await getSignedUrl(s3, command, { expiresIn: 3600 });
  } catch { return null; }
}

export async function getSignedAudioUrl(path: string): Promise<string | null> {
  try {
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: path });
    return await getSignedUrl(s3, command, { expiresIn: 3600 });
  } catch { return null; }
}
