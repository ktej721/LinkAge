import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { Shield } from 'lucide-react';

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  if (!user || user.role !== 'owner') {
    redirect('/login?role=owner');
  }

  const navItems = [
    { label: 'Dashboard', href: '/owner/dashboard' },
    { label: 'Review Queue', href: '/owner/review' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 border-t-4 border-slate-800">
      <NavBar user={user} navItems={navItems} />
      
      <div className="bg-slate-100 border-b border-slate-200 py-1.5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-widest">
          <Shield className="w-3.5 h-3.5" />
          Admin Session Active
        </div>
      </div>
      
      <main className="max-w-lg mx-auto px-4 py-5 sm:max-w-5xl sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
