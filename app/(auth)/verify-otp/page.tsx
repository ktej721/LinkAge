'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'senior';
  const flow = searchParams.get('flow'); // 'register' for helper registration

  const isHelperRegister = role === 'helper' && flow === 'register';

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const submittingRef = useRef(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const storedEmail = localStorage.getItem('linkage_auth_email');
    if (!storedEmail) {
      router.push(`/login?role=${role}`);
    } else {
      setEmail(storedEmail);
    }
  }, [router, role]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1]; // Only take last char if pasted
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && index > 0 && otp[index] === '') {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    
    // Focus last filled input
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    if (submittingRef.current || loading) return;
    submittingRef.current = true;
    setLoading(true);

    try {
      // ─── Helper Registration Flow: verify OTP + create account ───
      if (isHelperRegister) {
        const storedData = sessionStorage.getItem('linkage_helper_register');
        if (!storedData) {
          toast.error('Registration data not found. Please start over.');
          router.push('/login?role=helper');
          return;
        }

        const regData = JSON.parse(storedData);

        const res = await fetch('/api/auth/helper-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: regData.email,
            name: regData.name,
            password: regData.password,
            otp: otpValue,
            language_preference: regData.language_preference,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // Clean up stored data
        sessionStorage.removeItem('linkage_helper_register');
        localStorage.removeItem('linkage_auth_email');

        toast.success('Account created successfully! Welcome to LinkAge! 🎉');
        router.push(data.redirect || '/helper/dashboard');
        return;
      }

      // ─── Standard OTP Flow (seniors, owners) ───
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Successfully verified!');
      router.push(data.redirect || `/${data.user.role}/dashboard`);
    } catch (error: any) {
      toast.error(error.message);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  // Auto-submit when fully filled
  useEffect(() => {
    if (otp.join('').length === 6 && !loading && !submittingRef.current) {
      handleSubmit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleResend = async () => {
    if (timeLeft > 0) return;
    
    setLoading(true);
    try {
      if (isHelperRegister) {
        // Resend helper registration OTP
        const storedData = sessionStorage.getItem('linkage_helper_register');
        const regData = storedData ? JSON.parse(storedData) : { name: 'User' };

        const res = await fetch('/api/auth/helper-send-register-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name: regData.name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } else {
        const isOwner = role === 'owner';
        const endpoint = isOwner ? '/api/auth/owner-login' : '/api/auth/send-otp';
        
        const payload = isOwner 
          ? { email }
          : { email, name: 'User', role, is_new_user: false };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      }

      toast.success('New code sent to your email');
      setTimeLeft(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null; // Avoid flashing before redirect

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md shadow-lg border-gray-200">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">LinkAge</h1>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            {isHelperRegister ? 'Verify Your Email' : 'Verify Code'}
          </CardTitle>
          <CardDescription className="text-lg">
            We sent a 6-digit code to <br />
            <span className="font-medium text-gray-900">{email}</span>
            {isHelperRegister && (
              <span className="block text-sm text-amber-600 mt-2 font-medium">
                Your account will be created once verified
              </span>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8 flex flex-col items-center">
            <div 
              className="flex justify-between gap-2 sm:gap-4 w-full px-2"
              onPaste={handlePaste}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={loading}
                  className="w-12 h-16 sm:w-14 sm:h-16 text-center text-3xl font-bold rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500 disabled:opacity-50 transition-all bg-white shadow-sm"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <Button 
              type="submit" 
              size="lg"
              className={`w-full text-xl py-8 rounded-2xl disabled:opacity-70 ${
                isHelperRegister
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
              disabled={loading || otp.join('').length !== 6}
            >
              {loading 
                ? (isHelperRegister ? 'Creating Account...' : 'Verifying...') 
                : (isHelperRegister ? 'Verify & Create Account' : 'Verify Now')
              }
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            <span className="text-gray-500">Didn&apos;t receive the code? </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={timeLeft > 0 || loading}
              className={`font-semibold ${timeLeft > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-amber-600 hover:text-amber-800'}`}
            >
              {timeLeft > 0 ? `Resend in ${timeLeft}s` : 'Resend Code'}
            </button>
          </div>
          
          <button
             type="button"
             onClick={() => {
               sessionStorage.removeItem('linkage_helper_register');
               router.push(`/login?role=${role}`);
             }}
             className="text-gray-500 hover:text-gray-900 text-sm font-medium"
          >
             ← {isHelperRegister ? 'Back to Registration' : 'Change email address'}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
