'use client';

import { Request } from '@/types';
import { Clock, MessageSquare, CheckCircle, Globe, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-amber-50 text-amber-700 border-amber-200',
  answered: 'bg-slate-100 text-slate-700 border-slate-200',
  closed: 'bg-slate-50 text-slate-500 border-slate-200',
};

const STATUS_ICONS: Record<string, any> = {
  open: Clock,
  answered: CheckCircle,
  closed: MessageSquare,
};

interface RequestCardProps {
  request: Request;
  viewAs: 'senior' | 'helper' | 'owner';
}

export default function RequestCard({ request, viewAs }: RequestCardProps) {
  const StatusIcon = STATUS_ICONS[request.status];
  const approvedResponses = request.responses?.filter(r => r.is_approved).length || 0;
  const pendingResponses = request.responses?.filter(r => !r.is_approved && !r.is_rejected).length || 0;

  const isSenior = viewAs === 'senior';

  return (
    <div className={`rounded-2xl p-5 ${isSenior ? 'active:bg-slate-50' : 'active:scale-[0.99]'} transition-all duration-200 relative overflow-hidden group ${
      isSenior ? 'bg-white border-2 border-slate-200 senior-card' 
      : viewAs === 'helper' ? 'glass-card border-white/60' 
      : 'bg-white border border-slate-200 shadow-sm'
    }`}>
      {viewAs === 'helper' && <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400 rounded-full mix-blend-multiply filter blur-[40px] opacity-10 group-hover:opacity-30 transition-opacity pointer-events-none"></div>}
      <div className="relative z-10">
      <div className="flex justify-between items-start gap-4 mb-3">
        <h3 className={`font-bold text-slate-900 leading-snug flex-1 line-clamp-2 ${
          isSenior ? 'text-base' : 'text-lg'
        }`}>{request.title}</h3>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 flex-shrink-0 ${STATUS_COLORS[request.status]} ${viewAs === 'helper' ? 'bg-white/80 backdrop-blur-sm shadow-sm' : ''}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </div>

      <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed">{request.description}</p>

      {request.audio_url && (
        <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Voice Message</p>
          <audio controls src={request.audio_url} className="w-full h-10" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-4 font-medium">
        <span className="flex items-center gap-1 bg-slate-100/50 px-2 py-1 rounded-md">
          <Globe className="w-3.5 h-3.5" />
          <span className="capitalize text-slate-600">{request.language}</span>
        </span>
        <span>·</span>
        <span>{new Date(request.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        {approvedResponses > 0 && (
          <>
            <span>·</span>
            <span className="text-amber-600 font-bold">{approvedResponses} solution{approvedResponses > 1 ? 's' : ''}</span>
          </>
        )}
        {pendingResponses > 0 && viewAs === 'owner' && (
          <>
            <span>·</span>
            <span className="text-amber-600 font-bold">{pendingResponses} pending</span>
          </>
        )}
      </div>

      {isSenior && (() => {
        const callResponse = request.responses?.find((r: any) => r.response_type === 'video_call' && r.call_url);
        return (
          <div className="space-y-2">
            {callResponse && request.status !== 'closed' && (
              <Link href={`/senior/call?url=${encodeURIComponent((callResponse as any).call_url)}`} className="block">
                <Button className="w-full bg-amber-600 active:bg-amber-700 text-white text-lg h-14 rounded-xl font-extrabold gap-2 senior-btn">
                  Join Call
                </Button>
              </Link>
            )}
            <Link href={`/senior/my-requests?id=${request.id}`} className="block">
              <Button variant="outline" className="w-full border-2 border-slate-200 text-slate-700 active:bg-slate-100 h-12 rounded-xl font-bold text-base flex items-center justify-between">
                <span>View Details</span>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Button>
            </Link>
          </div>
        );
      })()}
      {viewAs === 'helper' && request.status === 'open' && (
        <div className="relative group/btn mt-2 border-t border-slate-100/50 pt-4">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-rose-500 rounded-xl blur-md opacity-30 group-hover/btn:opacity-60 transition-opacity translate-y-2"></div>
          <Link href={`/helper/answer/${request.id}`} className="block relative z-10 w-full">
            <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:to-rose-500 text-white h-12 rounded-xl font-bold shadow-md border border-white/20 transition-all">
              Help with this
            </Button>
          </Link>
        </div>
      )}
      </div>
    </div>
  );
}
