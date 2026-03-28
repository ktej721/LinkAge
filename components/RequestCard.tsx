'use client';

import { Request } from '@/types';
import { Clock, MessageSquare, CheckCircle, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-100 text-green-700 border-green-200',
  answered: 'bg-blue-100 text-blue-700 border-blue-200',
  closed: 'bg-gray-100 text-gray-700 border-gray-200',
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

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start gap-3 mb-3">
        <h3 className="font-semibold text-gray-900 text-lg leading-tight flex-1">{request.title}</h3>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1 ${STATUS_COLORS[request.status]}`}>
          <StatusIcon className="w-3 h-3" />
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </div>

      <p className="text-gray-600 text-sm line-clamp-2 mb-4">{request.description}</p>

      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
        <span className="flex items-center gap-1">
          <Globe className="w-3.5 h-3.5" />
          <span className="capitalize">{request.language}</span>
        </span>
        <span>•</span>
        <span>{new Date(request.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        {approvedResponses > 0 && (
          <>
            <span>•</span>
            <span className="text-green-600 font-medium">{approvedResponses} solution{approvedResponses > 1 ? 's' : ''}</span>
          </>
        )}
        {pendingResponses > 0 && viewAs === 'owner' && (
          <>
            <span>•</span>
            <span className="text-yellow-600 font-medium">{pendingResponses} pending review</span>
          </>
        )}
      </div>

      {viewAs === 'senior' && (() => {
        const callResponse = request.responses?.find((r: any) => r.response_type === 'video_call' && r.call_url);
        return (
          <div className="space-y-2">
            {callResponse && (
              <Link href={`/senior/call?url=${encodeURIComponent((callResponse as any).call_url)}`} className="block">
                <Button size="sm" className="w-full bg-green-500 hover:bg-green-600 text-white text-lg py-5 rounded-xl font-bold gap-2 animate-pulse">
                  📞 Join Call
                </Button>
              </Link>
            )}
            <Link href={`/senior/my-requests?id=${request.id}`} className="block">
              <Button variant="outline" size="sm" className="w-full">View Details</Button>
            </Link>
          </div>
        );
      })()}
      {viewAs === 'helper' && request.status === 'open' && (
        <Link href={`/helper/answer/${request.id}`} className="block">
          <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Help with this →</Button>
        </Link>
      )}
    </div>
  );
}
