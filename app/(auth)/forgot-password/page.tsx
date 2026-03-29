'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft, Mail, KeyRound, CheckCircle2 } from 'lucide-react';

type Step = 'email' | 'code' | 'new-password' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 1: Send reset code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Reset code sent to your email!');
      setStep('code');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Enter code → Step 3: New password
  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 'code') {
      if (code.length !== 6) {
        toast.error('Please enter the 6-digit code');
        return;
      }
      setStep('new-password');
      return;
    }

    // Step 3: Reset password
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token: code,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Password reset successfully!');
      setStep('success');
    } catch (error: any) {
      toast.error(error.message);
      // If token error, go back to code step
      if (error.message.includes('expired') || error.message.includes('Invalid')) {
        setStep('code');
        setCode('');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md shadow-lg border-gray-200">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">LinkAge</h1>
          </div>

          {step === 'email' && (
            <>
              <CardTitle className="text-2xl">Forgot Password?</CardTitle>
              <CardDescription className="text-base">
                Enter your helper email and we&apos;ll send you a reset code.
              </CardDescription>
            </>
          )}
          {step === 'code' && (
            <>
              <CardTitle className="text-2xl">Enter Reset Code</CardTitle>
              <CardDescription className="text-base">
                We sent a 6-digit code to<br />
                <span className="font-medium text-gray-900">{email}</span>
              </CardDescription>
            </>
          )}
          {step === 'new-password' && (
            <>
              <CardTitle className="text-2xl">Set New Password</CardTitle>
              <CardDescription className="text-base">
                Choose a strong password for your account.
              </CardDescription>
            </>
          )}
          {step === 'success' && (
            <>
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-amber-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Password Updated!</CardTitle>
              <CardDescription className="text-base">
                Your password has been reset. You can now login with your new password.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent>
          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-base py-6 pl-11"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full text-lg py-6 bg-amber-600 hover:bg-amber-700"
                disabled={loading || !email}
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </Button>
            </form>
          )}

          {/* Step 2: Code */}
          {step === 'code' && (
            <form onSubmit={handleVerifyAndReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">6-Digit Code</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-base py-6 pl-11 tracking-[0.3em] font-bold text-center"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full text-lg py-6 bg-amber-600 hover:bg-amber-700"
                disabled={loading || code.length !== 6}
              >
                Continue
              </Button>
            </form>
          )}

          {/* Step 3: New password */}
          {step === 'new-password' && (
            <form onSubmit={handleVerifyAndReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="text-base py-6 pr-12"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="text-base py-6"
                  required
                  minLength={6}
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full text-lg py-6 bg-amber-600 hover:bg-amber-700"
                disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <Button
              className="w-full text-lg py-6 bg-teal-600 hover:bg-teal-700"
              onClick={() => router.push('/login?role=helper')}
            >
              Go to Login
            </Button>
          )}
        </CardContent>

        <CardFooter className="flex justify-center">
          {step !== 'success' && (
            <Link
              href="/login?role=helper"
              className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
