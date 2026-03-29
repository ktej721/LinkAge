import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NavBar from '@/components/NavBar';
import BottomNav from '@/components/BottomNav';

export default async function HelperLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  if (!user || user.role !== 'helper') {
    redirect('/login?role=helper');
  }

  const navItems = [
    { label: 'Dashboard', href: '/helper/dashboard' },
    { label: 'Browse Requests', href: '/helper/browse' },
    { label: 'Leaderboard', href: '/helper/leaderboard' },
    { label: 'My Stats', href: '/helper/my-stats' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 has-bottom-nav relative overflow-hidden">
      {/* Ambient Animated Blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden flex items-center justify-center">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-amber-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-rose-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full h-full">
        <NavBar user={user} navItems={navItems} />
        
        <main className="max-w-lg mx-auto px-4 py-5 sm:max-w-5xl sm:px-6 lg:px-8">
          {children}
        </main>

        <BottomNav role="helper" />
      </div>
    </div>
  );
}
