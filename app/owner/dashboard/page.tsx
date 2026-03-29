import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users, FileQuestion, MessageSquare, Video, ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OwnerDashboard() {
  const user = await getSession();
  if (!user) return null;

  const [
    { count: seniorsCount },
    { count: helpersCount },
    { count: totalRequests },
    { count: openRequests },
    { count: pendingReviews }
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'senior'),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'helper'),
    supabaseAdmin.from('requests').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabaseAdmin.from('responses').select('*', { count: 'exact', head: true }).eq('response_type', 'video').eq('is_approved', false).eq('is_rejected', false),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm">Platform overview and pending moderations.</p>
        </div>
        
        {pendingReviews ? pendingReviews > 0 ? (
          <Link href="/owner/review">
             <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2 h-12 px-6 rounded-xl shadow-md">
               <ShieldAlert className="w-5 h-5" /> Review {pendingReviews} Pending Videos
             </Button>
          </Link>
        ) : null : null}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Users className="w-5 h-5" />
            <span className="font-medium text-sm">Seniors</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{seniorsCount || 0}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Users className="w-5 h-5" />
            <span className="font-medium text-sm">Helpers</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{helpersCount || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <FileQuestion className="w-5 h-5" />
            <span className="font-medium text-sm">Total Requests</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalRequests || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium text-sm">Open Requests</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{openRequests || 0}</p>
        </div>

        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm">
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <Video className="w-5 h-5" />
            <span className="font-medium text-sm">Pending Videos</span>
          </div>
          <p className="text-3xl font-bold text-amber-700">{pendingReviews || 0}</p>
        </div>
      </div>
    </div>
  );
}
