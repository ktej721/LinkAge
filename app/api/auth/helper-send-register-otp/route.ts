import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { sendOTPEmail, generateOTP } from '@/lib/mailer';
import { isCollegeEmail } from '@/lib/college-domains';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

// POST: Validate helper email + send OTP for registration (does NOT create user yet)
export async function POST(req: NextRequest) {
  try {
    const data = schema.parse(await req.json());

    // Validate college email
    if (!isCollegeEmail(data.email)) {
      return NextResponse.json(
        { error: 'Helpers must use a recognized college email address.' },
        { status: 400 }
      );
    }

    // Check if owner email
    const ownerEmails = process.env.OWNER_EMAILS?.split(',') || [];
    if (ownerEmails.includes(data.email)) {
      return NextResponse.json(
        { error: 'This email is reserved for admin use.' },
        { status: 400 }
      );
    }

    // Check if user already exists WITH a password (fully registered helper)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, role, password_hash')
      .eq('email', data.email)
      .maybeSingle();

    if (existingUser && existingUser.password_hash) {
      return NextResponse.json(
        { error: 'An account already exists with this email. Please login instead.' },
        { status: 409 }
      );
    }

    // Invalidate previous OTPs for this email
    await supabaseAdmin
      .from('otp_tokens')
      .update({ used: true })
      .eq('email', data.email)
      .eq('used', false);

    // Generate and store OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    console.log('[helper-send-register-otp] OTP:', otp, 'for:', data.email);

    const { error: insertError } = await supabaseAdmin.from('otp_tokens').insert({
      email: data.email,
      otp,
      purpose: 'helper_register',
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error('[helper-send-register-otp] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to generate OTP.' },
        { status: 500 }
      );
    }

    await sendOTPEmail(data.email, otp, data.name);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email!',
    });
  } catch (error: any) {
    console.error('[helper-send-register-otp] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
