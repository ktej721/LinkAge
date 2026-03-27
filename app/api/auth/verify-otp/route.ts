import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { createSession } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/mailer';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = schema.parse(await req.json());

    // Verify OTP
    const { data: token } = await supabaseAdmin
      .from('otp_tokens')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!token) {
      return NextResponse.json({ error: 'Invalid or expired OTP. Please try again.' }, { status: 400 });
    }

    // Mark OTP as used
    await supabaseAdmin.from('otp_tokens').update({ used: true }).eq('id', token.id);

    // Get user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Mark email verified
    if (!user.is_email_verified) {
      await supabaseAdmin
        .from('users')
        .update({ is_email_verified: true })
        .eq('id', user.id);
      await sendWelcomeEmail(user.email, user.name, user.role);
    }

    // Create session
    const sessionToken = await createSession(user.id);

    const response = NextResponse.json({
      success: true,
      user: { ...user, is_email_verified: true },
      redirect: `/${user.role}/dashboard`,
    });

    // Set cookie
    response.cookies.set('linkage_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
