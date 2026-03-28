'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isCollegeEmail, getCollegeName } from '@/lib/college-domains';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'senior';
  const isOwner = role === 'owner';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    language_preference: 'english',
  });
  
  const [collegeStatus, setCollegeStatus] = useState<{ recognized: boolean; name: string | null } | null>(null);

  // Validate college domain real-time for helper registration
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
    if (mode === 'register') {
      if (!formData.name) return false;
      if (role === 'helper' && (!collegeStatus?.recognized)) return false;
    }
    return true;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md shadow-lg border-gray-200">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <h1 className="text-3xl font-bold text-indigo-600 tracking-tight">🔗 LinkAge</h1>
          </div>
          <CardTitle className="text-2xl">
            {isOwner ? 'Admin Login' : mode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </CardTitle>
          <CardDescription className="text-base">
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
                className={`flex-1 py-2 rounded ${mode === 'login' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                onClick={() => setMode('login')}
              >
                Login
              </button>
              <button 
                type="button"
                className={`flex-1 py-2 rounded ${mode === 'register' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                onClick={() => setMode('register')}
              >
                Register
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && !isOwner && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  autoComplete="name"
                  placeholder="John Doe" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="text-base py-6"
                  required 
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                autoComplete="email"
                placeholder={role === 'helper' && mode === 'register' ? 'student@college.edu' : 'you@example.com'} 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="text-base py-6"
                required 
              />
              {role === 'helper' && mode === 'register' && (
                <div className="mt-1 text-sm">
                  {collegeStatus === null ? (
                     <span className="text-slate-500">Must be a recognized institution email.</span>
                  ) : collegeStatus.recognized ? (
                     <span className="text-green-600 font-medium">✅ College recognized: {collegeStatus.name}</span>
                  ) : (
                     <span className="text-red-500 font-medium">❌ Not a recognized college email.</span>
                  )}
                </div>
              )}
            </div>

            {mode === 'register' && role === 'senior' && !isOwner && (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  autoComplete="tel"
                  placeholder="+1 (555) 000-0000" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="text-base py-6"
                />
              </div>
            )}

            {mode === 'register' && !isOwner && (
               <div className="space-y-2">
                 <Label htmlFor="language">Preferred Language</Label>
                 <Select 
                   value={formData.language_preference} 
                   onValueChange={(val) => setFormData({...formData, language_preference: val || 'english'})}
                 >
                   <SelectTrigger className="text-base py-6">
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
              className={`w-full text-lg py-6 mt-4 ${role === 'senior' ? 'bg-orange-600 hover:bg-orange-700' : role === 'helper' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-purple-600 hover:bg-purple-700'}`}
              disabled={loading || !isFormValid()}
            >
              {loading ? 'Sending Code...' : mode === 'login' ? 'Send Verification Code' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
