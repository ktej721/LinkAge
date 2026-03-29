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

    console.log('[verify-otp] Verifying OTP for:', email, 'OTP entered:', otp);

    // Get the latest unused OTP for this email
    const { data: token, error: tokenError } = await supabaseAdmin
      .from('otp_tokens')
      .select('*')
      .eq('email', email)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('[verify-otp] Token found:', token ? `OTP=${token.otp}, expires=${token.expires_at}` : 'NONE', 'Error:', tokenError?.message);

    if (!token) {
      return NextResponse.json({ error: 'No active OTP found. Please request a new one.' }, { status: 400 });
    }

    // Check if OTP matches
    if (token.otp !== otp) {
      console.log('[verify-otp] OTP mismatch. Expected:', token.otp, 'Got:', otp);
      return NextResponse.json({ error: 'Invalid OTP. Please check and try again.' }, { status: 400 });
    }

    // Check if expired
    if (new Date(token.expires_at) < new Date()) {
      console.log('[verify-otp] OTP expired at:', token.expires_at, 'Current time:', new Date().toISOString());
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
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

    response.cookies.set('linkage_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 365 * 24 * 60 * 60, // 10 years
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
