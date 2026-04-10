import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { isCollegeEmail, getCollegeName } from '@/lib/college-domains';
import { sendWelcomeEmail } from '@/lib/mailer';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  phone: z.string().optional(),
  language_preference: z.string().optional(),
});

// POST: Register a new helper — requires verified OTP + password
export async function POST(req: NextRequest) {
  try {
    const data = schema.parse(await req.json());

    // 1. Verify OTP first
    const token = await prisma.otpToken.findFirst({
      where: {
        email: data.email,
        used: false,
      },
      orderBy: { created_at: 'desc' },
    });

    if (!token) {
      return NextResponse.json(
        { error: 'No active verification code found. Please request a new one.' },
        { status: 400 }
      );
    }

    if (token.otp !== data.otp) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please check and try again.' },
        { status: 400 }
      );
    }

    if (new Date(token.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await prisma.otpToken.update({ where: { id: token.id }, data: { used: true } });

    // 2. Validate college email
    if (!isCollegeEmail(data.email)) {
      return NextResponse.json(
        { error: 'Helpers must use a recognized college email address.' },
        { status: 400 }
      );
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);
    const collegeName = getCollegeName(data.email);
    const collegeDomain = data.email.split('@')[1];

    // 4. Check if user already exists (from old OTP registration)
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email },
      select: { id: true, role: true, password_hash: true }
    });

    let userId: string;

    if (existingUser) {
      // Update existing helper with password
      if (existingUser.role !== 'helper') {
        return NextResponse.json(
          { error: 'This email is registered with a different role.' },
          { status: 409 }
        );
      }

      try {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            password_hash: passwordHash,
            name: data.name,
            is_email_verified: true,
          }
        });
      } catch (updateErr: any) {
        console.error('[helper-register] Update error:', updateErr);
        return NextResponse.json(
          { error: updateErr.message || 'Failed to update account.' },
          { status: 500 }
        );
      }

      userId = existingUser.id;
    } else {
      // Create new user
      try {
        const newUser = await prisma.user.create({
          data: {
            email: data.email,
            name: data.name,
            role: 'helper',
            phone: data.phone || null,
            language_preference: data.language_preference || 'english',
            college_domain: collegeDomain,
            college_name: collegeName,
            is_email_verified: true,
            password_hash: passwordHash,
          }
        });
        userId = newUser.id;
      } catch (insertErr: any) {
        console.error('[helper-register] Insert error:', insertErr);
        return NextResponse.json(
          { error: insertErr.message || 'Failed to create account.' },
          { status: 500 }
        );
      }

      // Send welcome email (fire-and-forget)
      sendWelcomeEmail(data.email, data.name, 'helper').catch(console.error);
    }

    // 5. Create session
    const sessionToken = await createSession(userId);

    const response = NextResponse.json({
      success: true,
      user: { id: userId, role: 'helper', name: data.name },
      redirect: '/helper/dashboard',
    });

    response.cookies.set('linkage_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 365 * 24 * 60 * 60, // 10 years
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
