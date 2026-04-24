import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { sendOTPEmail, generateOTP } from '@/lib/mailer';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

// POST: Send password reset email to helper
export async function POST(req: NextRequest) {
  try {
    const { email } = schema.parse(await req.json());

    // Find the helper
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name, role')
      .eq('email', email)
      .eq('role', 'helper')
      .maybeSingle();

    if (!user) {
      return NextResponse.json(
        { error: 'No helper account found with this email.' },
        { status: 404 }
      );
    }

    const resetToken = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Invalidate previous reset tokens
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('email', email)
      .eq('used', false);

    // Store token
    await supabaseAdmin.from('password_reset_tokens').insert({
      email,
      token: resetToken,
      expires_at: expiresAt,
    });

    // Send reset email
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
