import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendOTPEmail, generateOTP } from '@/lib/mailer';
import { z } from 'zod';
import crypto from 'crypto';

const schema = z.object({
  email: z.string().email(),
});

// POST: Send password reset email to helper
export async function POST(req: NextRequest) {
  try {
    const { email } = schema.parse(await req.json());

    // Find the helper
    const user = await prisma.user.findFirst({
      where: { email, role: 'helper' },
      select: { id: true, name: true, role: true }
    });

    if (!user) {
      // Don't reveal if user exists or not for security — but for hackathon, be helpful
      return NextResponse.json(
        { error: 'No helper account found with this email.' },
        { status: 404 }
      );
    }

    // Generate a reset token (6-digit OTP for simplicity)
    const resetToken = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    // Invalidate previous reset tokens
    await prisma.passwordResetToken.updateMany({
      where: { email, used: false },
      data: { used: true }
    });

    // Store token
    await prisma.passwordResetToken.create({
      data: {
        email,
        token: resetToken,
        expires_at: new Date(expiresAt),
      }
    });

    // Send reset email (reusing OTP email template)
    await sendOTPEmail(email, resetToken, user.name);

    console.log('[forgot-password] Reset token sent to:', email, 'Token:', resetToken);

    return NextResponse.json({
      success: true,
      message: 'Password reset code sent to your email.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to send reset email' },
      { status: 500 }
    );
  }
}
