import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendOTPEmail, generateOTP } from '@/lib/mailer';
import { isCollegeEmail, getCollegeName } from '@/lib/college-domains';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).default('User'),
  role: z.enum(['senior', 'helper']),
  language_preference: z.string().optional(),
  phone: z.string().optional(),
  is_new_user: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Validate college email for helpers
    if (data.role === 'helper' && !isCollegeEmail(data.email)) {
      return NextResponse.json(
        { error: 'Helpers must use a recognized college email address. Please use your institutional email.' },
        { status: 400 }
      );
    }

    // Check if owner email
    const ownerEmails = process.env.OWNER_EMAILS?.split(',') || [];
    if (ownerEmails.includes(data.email)) {
      return NextResponse.json({ error: 'This email is reserved for owner login.' }, { status: 400 });
    }

    // If registering, create or update user
    if (data.is_new_user) {
      const collegeName = data.role === 'helper' ? getCollegeName(data.email) : null;
      const collegeDomain = data.role === 'helper' ? data.email.split('@')[1] : null;

      const existingUser = await prisma.user.findFirst({
        where: { email: data.email },
        select: { id: true }
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            email: data.email,
            name: data.name,
            role: data.role,
            phone: data.phone,
            language_preference: data.language_preference || 'english',
            college_domain: collegeDomain,
            college_name: collegeName,
            is_email_verified: false,
          }
        });
      }
    } else {
      // Login: user must exist
      const user = await prisma.user.findFirst({
        where: { email: data.email },
        select: { id: true, role: true }
      });

      if (!user) {
        return NextResponse.json({ error: 'No account found with this email. Please register first.' }, { status: 404 });
      }
    }

    // Invalidate previous OTPs
    await prisma.otpToken.updateMany({
      where: { email: data.email, used: false },
      data: { used: true }
    });

    // Generate and store OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    console.log('[send-otp] Generated OTP:', otp, 'for:', data.email, 'expires:', expiresAt);

    try {
      await prisma.otpToken.create({
        data: {
          email: data.email,
          otp,
          purpose: data.is_new_user ? 'register' : 'login',
          expires_at: new Date(expiresAt),
        }
      });
    } catch (insertError) {
      console.error('[send-otp] Failed to insert OTP:', insertError);
      return NextResponse.json({ error: 'Failed to generate OTP. Database error.' }, { status: 500 });
    }

    // Send email
    await sendOTPEmail(data.email, otp, data.name);
    console.log('[send-otp] Email sent successfully to:', data.email);

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error: any) {
    console.error('send-otp error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send OTP' }, { status: 500 });
  }
}
