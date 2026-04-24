import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { createSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// POST: Helper login with email + password
export async function POST(req: NextRequest) {
  try {
    const { email, password } = schema.parse(await req.json());

    // Find the user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', 'helper')
      .maybeSingle();

    if (!user) {
      return NextResponse.json(
        { error: 'No helper account found with this email. Please register first.' },
        { status: 404 }
      );
    }

    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'No password set for this account. Please use "Forgot Password" to set one, or register again.' },
        { status: 400 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Incorrect password. Please try again.' },
        { status: 401 }
      );
    }

    // Create session
    const sessionToken = await createSession(user.id);

    const response = NextResponse.json({
      success: true,
      user: { ...user, password_hash: undefined },
      redirect: '/helper/dashboard',
    });

    response.cookies.set('linkage_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 365 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
