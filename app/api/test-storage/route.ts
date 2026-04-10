import { NextResponse } from 'next/server';
import { s3 } from '@/lib/s3';
import { ListBucketsCommand } from '@aws-sdk/client-s3';

export async function GET() {
  try {
    const data = await s3.send(new ListBucketsCommand({}));
    return NextResponse.json({
      success: true,
      buckets: data.Buckets?.map(b => b.Name)
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
