import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NavBar from '@/components/NavBar';

export default async function SeniorLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  if (!user || user.role !== 'senior') {
    redirect('/login?role=senior');
  }

  const navItems = [
    { label: 'Dashboard', href: '/senior/dashboard' },
    { label: 'New Request', href: '/senior/new-request' },
    { label: 'My Requests', href: '/senior/my-requests' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 text-lg">
      <NavBar user={user} navItems={navItems} />
      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
