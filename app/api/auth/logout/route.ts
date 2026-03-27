import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('linkage_session')?.value;
  if (token) await deleteSession(token);
  
  const response = NextResponse.json({ success: true });
  response.cookies.delete('linkage_session');
  return response;
}
