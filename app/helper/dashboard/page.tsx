import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Search, Settings, ShieldCheck, Video, Clock, Trophy, BarChart3 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HelperDashboard() {
  const user = await getSession();
  if (!user) return null;

  const responses = await prisma.response.findMany({
    where: { helper_id: user.id },
    include: { request: { select: { title: true } } },
    orderBy: { created_at: 'desc' }
  });

  const total = responses?.length || 0;
  const approved = responses?.filter((r: any) => r.is_approved).length || 0;
  const pending = responses?.filter((r: any) => !r.is_approved && !r.is_rejected).length || 0;
  const rejected = responses?.filter((r: any) => r.is_rejected).length || 0;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400 rounded-full mix-blend-multiply filter blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-slate-900">Welcome, {user.name}!</h1>
          <p className="text-slate-500 mt-1">{user.college_name || 'Student Helper'}</p>
        </div>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1.5 text-sm flex gap-1.5 relative z-10 w-fit">
          <ShieldCheck className="w-4 h-4" /> Student Volunteer
        </Badge>
      </div>

      {/* Info Card */}
      <div className="p-5 rounded-2xl glass-panel relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-50 to-orange-50/50 mix-blend-overlay"></div>
        <h3 className="font-semibold mb-1 text-slate-900 text-sm relative z-10 flex items-center gap-2">
           <span className="text-xl">✨</span> How it works
        </h3>
        <p className="text-slate-600 text-sm relative z-10">
          Browse questions from seniors and submit your answers. Text answers go live immediately. Video answers are reviewed by our moderation team before being shown.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute -inset-1 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
          <div className="relative">
            <p className="text-sm text-slate-500 font-medium">Total Answers</p>
            <p className="text-4xl font-black text-slate-900 mt-2 filter drop-shadow-sm">{total}</p>
          </div>
        </div>
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute -inset-1 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
          <div className="relative">
            <p className="text-sm text-green-600 font-medium">Approved</p>
            <p className="text-4xl font-black text-slate-900 mt-2 filter drop-shadow-sm">{approved}</p>
          </div>
        </div>
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute -inset-1 bg-gradient-to-br from-amber-50 to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
          <div className="relative">
            <p className="text-sm text-amber-600 font-medium">Pending</p>
            <p className="text-4xl font-black text-slate-900 mt-2 filter drop-shadow-sm">{pending}</p>
          </div>
        </div>
         <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute -inset-1 bg-gradient-to-br from-rose-50 to-red-50 opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
          <div className="relative">
            <p className="text-sm text-rose-600 font-medium">Rejected</p>
            <p className="text-4xl font-black text-slate-900 mt-2 filter drop-shadow-sm">{rejected}</p>
          </div>
        </div>
      </div>

      {/* Main Action */}
      <div className="flex justify-center relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 group-active:opacity-100 transition-opacity duration-300"></div>
        <Link href="/helper/browse" className="w-full relative">
          <Button size="lg" className="w-full text-lg h-16 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 active:from-amber-600 active:to-orange-600 text-white shadow-xl hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] border border-white/20 gap-3 font-extrabold transition-all hover:scale-[1.02]">
            <Search className="w-6 h-6 animate-pulse" /> Browse Open Requests
          </Button>
        </Link>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/helper/leaderboard" className="block focus:outline-none focus:ring-4 focus:ring-amber-500/30 rounded-2xl">
          <div className="glass-card p-5 rounded-2xl flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shadow-inner border border-white">
              <Trophy className="w-6 h-6 text-orange-600 drop-shadow-sm" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">Leaderboard</p>
              <p className="text-sm text-slate-500">See how you rank</p>
            </div>
          </div>
        </Link>
        <Link href="/helper/my-stats" className="block focus:outline-none focus:ring-4 focus:ring-rose-500/30 rounded-2xl">
          <div className="glass-card p-5 rounded-2xl flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center shadow-inner border border-white">
              <BarChart3 className="w-6 h-6 text-rose-600 drop-shadow-sm" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">My Stats</p>
              <p className="text-sm text-slate-500">Milestones & rewards</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="relative z-10 pb-8">
        <h2 className="text-xl font-extrabold text-slate-900 mb-5 relative inline-block">
          Recent Activity
          <div className="absolute -bottom-1 left-0 w-1/2 h-1 bg-gradient-to-r from-amber-400 to-transparent rounded-full"></div>
        </h2>
        
        {total === 0 ? (
          <div className="text-center p-10 glass-card rounded-3xl border-dashed border-2 border-slate-300">
            <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-bold text-slate-900 mb-1">No answers yet</p>
            <p className="text-slate-500 text-sm">Browse open requests and start helping!</p>
          </div>
        ) : (
          <div className="glass-panel rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-400 rounded-full mix-blend-multiply filter blur-[60px] opacity-10 pointer-events-none"></div>
            <div className="divide-y divide-white/40">
              {responses?.slice(0, 5).map((resp: any) => (
                <div key={resp.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div>
                    <h4 className="font-semibold text-slate-900 line-clamp-1 text-sm">{resp.request?.title || 'Unknown Request'}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                      <span>{new Date(resp.created_at).toLocaleDateString()}</span>
                      <span>·</span>
                      <span className="capitalize">{resp.response_type} response</span>
                    </p>
                  </div>
                  
                  <div>
                    {resp.is_approved ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                      </span>
                    ) : resp.is_rejected ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                        <Settings className="w-3.5 h-3.5" /> Needs Revision
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                        <Clock className="w-3.5 h-3.5" /> In Review
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {total > 5 && (
              <div className="p-3 bg-slate-50 text-center border-t border-slate-200">
                <span className="text-xs text-slate-400">Showing 5 of {total} answers</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
