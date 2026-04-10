import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendOTPEmail, generateOTP } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const ownerEmails = process.env.OWNER_EMAILS?.split(',').map(e => e.trim()) || [];
  
  if (!ownerEmails.includes(email)) {
    return NextResponse.json({ error: 'Unauthorized email.' }, { status: 403 });
  }

  // Create owner user if not exists
  const existing = await prisma.user.findFirst({
    where: { email: email },
    select: { id: true }
  });
  
  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        name: 'Admin',
        role: 'owner',
        is_email_verified: true,
      }
    });
  }

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.otpToken.create({
    data: {
      email,
      otp,
      purpose: 'login',
      expires_at: expiresAt
    }
  });
  await sendOTPEmail(email, otp, 'Admin');

  return NextResponse.json({ success: true });
}
