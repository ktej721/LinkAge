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
    <div className="min-h-screen bg-slate-50 text-gray-900 has-bottom-nav">
      <NavBar user={user} navItems={navItems} />
      
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-8 sm:px-6 lg:px-8">
        {children}
      </main>

      <BottomNav role="helper" />
    </div>
  );
}
