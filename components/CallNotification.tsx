'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Phone, PhoneOff, X } from 'lucide-react';

interface IncomingCall {
  callUrl: string;
  helperName: string;
  requestTitle: string;
}

export default function CallNotification({
  seniorId,
  requestIds,
}: {
  seniorId: string;
  requestIds: string[];
}) {
  const router = useRouter();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  useEffect(() => {
    if (!seniorId) return;

    const channel = supabase
      .channel('incoming-calls')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'responses',
          filter: `response_type=eq.video_call`,
        },
        async (payload) => {
          const response = payload.new as any;

          // Check if this response is for one of the senior's requests
          if (requestIds.length > 0 && !requestIds.includes(response.request_id)) return;
          if (!response.call_url) return;

          try {
            const { data: helper } = await supabase
              .from('users')
              .select('name')
              .eq('id', response.helper_id)
              .single();

            const { data: request } = await supabase
              .from('requests')
              .select('title')
              .eq('id', response.request_id)
              .single();

            setIncomingCall({
              callUrl: response.call_url,
              helperName: helper?.name || 'A helper',
              requestTitle: request?.title || 'your question',
            });
          } catch {
            setIncomingCall({
              callUrl: response.call_url,
              helperName: 'A helper',
              requestTitle: 'your question',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestIds, seniorId]);

  if (!incomingCall) return null;

  const handleAnswer = () => {
    const url = incomingCall.callUrl;
    setIncomingCall(null);
    router.push(`/senior/call?url=${encodeURIComponent(url)}`);
  };

  const handleDismiss = () => {
    setIncomingCall(null);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-center shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Call icon */}
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-amber-100 rounded-full animate-ping opacity-20" />
          <div className="relative w-20 h-20 bg-amber-600 rounded-full flex items-center justify-center shadow-lg">
            <Phone className="w-8 h-8 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">Incoming Call</h2>
        <p className="text-lg text-slate-600 mb-1">
          <span className="font-semibold text-slate-900">{incomingCall.helperName}</span> is calling you
        </p>
        <p className="text-sm text-slate-400 mb-8">
          About: &ldquo;{incomingCall.requestTitle}&rdquo;
        </p>

        <div className="space-y-3">
          <button
            onClick={handleAnswer}
            className="w-full bg-amber-600 active:bg-amber-700 text-white font-extrabold h-16 px-6 rounded-2xl text-lg flex items-center justify-center gap-3 transition-all shadow-md senior-btn"
          >
            <Phone className="w-6 h-6" />
            Answer Call
          </button>
          <button
            onClick={handleDismiss}
            className="w-full bg-slate-100 active:bg-slate-200 text-slate-600 font-bold h-12 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
