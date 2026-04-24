import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
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
    const { data: resetToken } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('email', email)
      .eq('token', token)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset code. Please request a new one.' },
        { status: 400 }
      );
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Reset code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(new_password, 12);

    // Update user's password
    const { error: updateErr } = await supabaseAdmin
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('email', email)
      .eq('role', 'helper');

    if (updateErr) {
      return NextResponse.json(
        { error: 'Failed to update password.' },
        { status: 500 }
      );
    }

    // Mark token as used
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', resetToken.id);

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
