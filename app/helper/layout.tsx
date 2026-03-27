import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { ShieldCheck } from 'lucide-react';

export default async function HelperLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  if (!user || user.role !== 'helper') {
    redirect('/login?role=helper');
  }

  const navItems = [
    { label: 'Dashboard', href: '/helper/dashboard' },
    { label: 'Browse Requests', href: '/helper/browse' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      <NavBar user={user} navItems={navItems} />
      
      {user.is_kyc_verified && (
        <div className="bg-emerald-50 border-b border-emerald-200 py-2">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-2 text-emerald-700 text-sm font-medium">
            <ShieldCheck className="w-4 h-4" />
            Verified Student Volunteer
          </div>
        </div>
      )}
      
      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
