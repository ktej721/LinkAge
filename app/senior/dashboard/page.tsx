import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import Link from 'next/link';
import { Mic, CheckCircle2, Clock, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SeniorDashboard() {
  const user = await getSession();
  if (!user) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const { data: requests } = await supabaseAdmin
    .from('requests')
    .select('*, responses(id, is_approved)')
    .eq('senior_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const total = requests?.length || 0;

  return (
    <div className="space-y-6">
      {/* Greeting — large for seniors */}
      <div className="pt-1">
        <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">{greeting},</h1>
        <h1 className="text-2xl font-extrabold text-amber-600 leading-tight">{user.name.split(' ')[0]}!</h1>
        <p className="text-base text-slate-500 mt-2">How can we help you today?</p>
      </div>

      {/* Main CTA — extra-large touch target */}
      <Link href="/senior/new-request" className="block">
        <div className="bg-amber-600 active:bg-amber-700 rounded-2xl p-6 text-white shadow-lg active:shadow-md transition-all senior-card">
          <div className="flex items-center gap-4">
            <div className="bg-white/25 w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-extrabold mb-0.5">Ask a New Question</h2>
              <p className="text-amber-100 text-sm">Tap here and speak your question</p>
            </div>
            <ChevronRight className="w-6 h-6 text-white/60 flex-shrink-0" />
          </div>
        </div>
      </Link>

      {/* Recent Questions */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-slate-900">Recent Questions</h2>
          {total > 0 && (
            <Link href="/senior/my-requests" className="text-amber-600 font-bold text-sm active:text-amber-700">
              View All
            </Link>
          )}
        </div>

        {total === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 text-center senior-card">
            <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No questions yet</h3>
            <p className="text-base text-slate-500 leading-relaxed">
              Tap the button above and speak your question. Our student volunteers are ready to help you.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests?.map(req => {
              const hasApproved = req.responses?.some((r: any) => r.is_approved);
              const isClosed = req.status === 'closed';

              let statusLabel: string;
              let StatusIcon: typeof CheckCircle2;
              let statusStyles: string;

              if (isClosed) {
                statusLabel = 'Resolved';
                StatusIcon = CheckCircle2;
                statusStyles = 'text-slate-400 bg-slate-100';
              } else if (hasApproved) {
                statusLabel = 'Answer ready — tap to view';
                StatusIcon = CheckCircle2;
                statusStyles = 'text-amber-700 bg-amber-50';
              } else {
                statusLabel = 'Waiting for answer...';
                StatusIcon = Clock;
                statusStyles = 'text-slate-500 bg-slate-50';
              }

              return (
                <Link key={req.id} href={`/senior/my-requests?id=${req.id}`} className="block">
                  <div className="bg-white rounded-xl border-2 border-slate-200 p-4 active:bg-slate-50 transition-colors senior-card">
                    <h3 className="font-bold text-slate-900 text-base mb-2 line-clamp-2 leading-snug">{req.title}</h3>
                    <div className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${statusStyles}`}>
                      <StatusIcon className="w-4 h-4" />
                      <span>{statusLabel}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
