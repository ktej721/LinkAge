import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NavBar from '@/components/NavBar';
import BottomNav from '@/components/BottomNav';
import CallNotification from '@/components/CallNotification';
import { supabaseAdmin } from '@/lib/supabase-server';

export default async function SeniorLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  if (!user || user.role !== 'senior') {
    redirect('/login?role=senior');
  }

  let requestIds: string[] = [];
  try {
    const { data: requests } = await supabaseAdmin
      .from('requests')
      .select('id')
      .eq('senior_id', user.id);
    requestIds = (requests || []).map((r: any) => r.id);
  } catch (err) {
    // Silently handle — call notification is a nice-to-have
  }

  const navItems = [
    { label: 'Home', href: '/senior/dashboard' },
    { label: 'Ask a Question', href: '/senior/new-request' },
    { label: 'History', href: '/senior/my-requests' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 has-bottom-nav senior-mode">
      <CallNotification seniorId={user.id} requestIds={requestIds} />
      <NavBar user={user} navItems={navItems} />
      <main className="max-w-lg mx-auto px-4 py-5 sm:max-w-5xl sm:px-6 lg:px-8">
        {children}
      </main>
      <BottomNav role="senior" />
    </div>
  );
}
