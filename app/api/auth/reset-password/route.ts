import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  token: z.string().length(6),
  new_password: z.string().min(6, 'Password must be at least 6 characters'),
});

// POST: Reset password using token
export async function POST(req: NextRequest) {
  try {
    const { email, token, new_password } = schema.parse(await req.json());

    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { email, token, used: false },
      orderBy: { created_at: 'desc' }
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset code. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Reset code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(new_password, 12);

    // Update user's password
    try {
      await prisma.user.updateMany({
        where: { email, role: 'helper' },
        data: { password_hash: passwordHash }
      });
    } catch (updateErr) {
      return NextResponse.json(
        { error: 'Failed to update password.' },
        { status: 500 }
      );
    }

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true }
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully! You can now login.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Password reset failed' },
      { status: 500 }
    );
  }
}
