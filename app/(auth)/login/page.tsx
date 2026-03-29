'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isCollegeEmail, getCollegeName } from '@/lib/college-domains';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'senior';
  const isOwner = role === 'owner';
  const isHelper = role === 'helper';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    language_preference: 'english',
  });
  
  const [collegeStatus, setCollegeStatus] = useState<{ recognized: boolean; name: string | null } | null>(null);

  useEffect(() => {
    if (role === 'helper' && mode === 'register' && formData.email) {
      if (formData.email.includes('@')) {
        const recognized = isCollegeEmail(formData.email);
        const name = getCollegeName(formData.email);
        setCollegeStatus({ recognized, name });
      } else {
        setCollegeStatus(null);
      }
    } else {
      setCollegeStatus(null);
    }
  }, [formData.email, role, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isOwner) {
      try {
        const res = await fetch('/api/auth/owner-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        localStorage.setItem('linkage_auth_email', formData.email);
        toast.success(`OTP sent to ${formData.email}`);
        router.push(`/verify-otp?role=${role}`);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isHelper && mode === 'login') {
      try {
        const res = await fetch('/api/auth/helper-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        toast.success('Logged in successfully!');
        router.push(data.redirect || '/helper/dashboard');
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isHelper && mode === 'register') {
      try {
        const res = await fetch('/api/auth/helper-send-register-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        sessionStorage.setItem('linkage_helper_register', JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          language_preference: formData.language_preference,
        }));
        localStorage.setItem('linkage_auth_email', formData.email);

        toast.success('Verification code sent to your email!');
        router.push('/verify-otp?role=helper&flow=register');
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: mode === 'register' ? formData.name : 'User',
          role,
          phone: formData.phone,
          language_preference: formData.language_preference,
          is_new_user: mode === 'register',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem('linkage_auth_email', formData.email);
      toast.success(data.message || 'OTP sent successfully!');
      router.push(`/verify-otp?role=${role}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    if (!formData.email) return false;
    if (isHelper && !formData.password) return false;
    if (isHelper && formData.password.length < 6) return false;
    if (mode === 'register') {
      if (!formData.name) return false;
      if (role === 'helper' && (!collegeStatus?.recognized)) return false;
    }
    return true;
  };

  return (
    <div className="min-h-screen flex flex-col justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md mx-auto space-y-4">
        {/* Role switcher */}
        {!isOwner && (
          <div className="flex rounded-xl p-1 bg-white shadow-sm border border-slate-200 font-medium text-sm">
            <button
              type="button"
              className={`flex-1 py-3 rounded-lg transition-all font-bold ${
                role === 'senior'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => router.push('/login?role=senior')}
            >
              I Need Help
            </button>
            <button
              type="button"
              className={`flex-1 py-3 rounded-lg transition-all font-bold ${
                role === 'helper'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => router.push('/login?role=helper')}
            >
              I Want to Help
            </button>
          </div>
        )}

      <Card className="w-full shadow-lg border-slate-200">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">LinkAge</h1>
          </div>
          <CardTitle className="text-2xl text-slate-900">
            {isOwner ? 'Admin Login' : mode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </CardTitle>
          <CardDescription className="text-base text-slate-500">
            {isOwner 
              ? 'Enter your admin email to proceed.'
              : role === 'senior' 
                ? 'Sign in to ask for help.' 
                : 'Sign in to help seniors in your community.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!isOwner && (
            <div className="flex rounded-md p-1 bg-slate-100 mb-6 font-medium text-sm">
              <button 
                type="button"
                className={`flex-1 py-2 rounded ${mode === 'login' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500'}`}
                onClick={() => setMode('login')}
              >
                Login
              </button>
              <button 
                type="button"
                className={`flex-1 py-2 rounded ${mode === 'register' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500'}`}
                onClick={() => setMode('register')}
              >
                Register
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && !isOwner && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700">Full Name</Label>
                <Input 
                  id="name" 
                  autoComplete="name"
                  placeholder="John Doe" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="text-base py-6 border-slate-200"
                  required 
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                autoComplete="email"
                placeholder={role === 'helper' && mode === 'register' ? 'student@college.edu' : 'you@example.com'} 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="text-base py-6 border-slate-200"
                required 
              />
              {role === 'helper' && mode === 'register' && (
                <div className="mt-1 text-sm">
                  {collegeStatus === null ? (
                     <span className="text-slate-400">Must be a recognized institution email.</span>
                  ) : collegeStatus.recognized ? (
                     <span className="text-amber-600 font-medium">College recognized: {collegeStatus.name}</span>
                  ) : (
                     <span className="text-red-500 font-medium">Not a recognized college email.</span>
                  )}
                </div>
              )}
            </div>

            {isHelper && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    placeholder={mode === 'register' ? 'Choose a strong password' : 'Enter your password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="text-base py-6 pr-12 border-slate-200"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {mode === 'register' && formData.password && formData.password.length < 6 && (
                  <p className="text-xs text-red-500">Password must be at least 6 characters</p>
                )}
              </div>
            )}

            {mode === 'register' && role === 'senior' && !isOwner && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700">Phone Number (Optional)</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  autoComplete="tel"
                  placeholder="+1 (555) 000-0000" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="text-base py-6 border-slate-200"
                />
              </div>
            )}

            {mode === 'register' && !isOwner && (
               <div className="space-y-2">
                 <Label htmlFor="language" className="text-slate-700">Preferred Language</Label>
                 <Select 
                   value={formData.language_preference} 
                   onValueChange={(val) => setFormData({...formData, language_preference: val || 'english'})}
                 >
                   <SelectTrigger className="text-base py-6 border-slate-200">
                     <SelectValue placeholder="Select Language" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="english">English</SelectItem>
                     <SelectItem value="hindi">Hindi</SelectItem>
                     <SelectItem value="tamil">Tamil</SelectItem>
                     <SelectItem value="telugu">Telugu</SelectItem>
                     <SelectItem value="kannada">Kannada</SelectItem>
                     <SelectItem value="malayalam">Malayalam</SelectItem>
                     <SelectItem value="marathi">Marathi</SelectItem>
                     <SelectItem value="bengali">Bengali</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
            )}

            <Button 
              type="submit" 
              className="w-full text-lg h-14 mt-4 bg-amber-600 active:bg-amber-700 font-extrabold rounded-xl"
              disabled={loading || !isFormValid()}
            >
              {loading 
                ? (isHelper 
                    ? (mode === 'login' ? 'Logging in...' : 'Sending Verification Code...')
                    : 'Sending Code...')
                : (isHelper 
                    ? (mode === 'login' ? 'Login' : 'Verify Email & Create Account')
                    : (mode === 'login' ? 'Send Verification Code' : 'Create Account')
                  )
              }
            </Button>
          </form>

          {isHelper && mode === 'login' && (
            <div className="text-center mt-4">
              <Link
                href="/forgot-password"
                className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          )}

          {isHelper && mode === 'register' && (
            <p className="text-xs text-slate-400 text-center mt-4">
              We&apos;ll send a verification code to your college email to confirm it&apos;s you.
            </p>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-slate-400">Loading...</p></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
