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
    <div className="min-h-screen bg-slate-50 text-gray-900 border-t-4 border-purple-600">
      <NavBar user={user} navItems={navItems} />
      
      <div className="bg-purple-50 border-b border-purple-200 py-1.5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-2 text-purple-700 text-xs font-bold uppercase tracking-widest">
          <Shield className="w-3.5 h-3.5" />
          Admin Session Active
        </div>
      </div>
      
      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
