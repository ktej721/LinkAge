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
    if (!requestIds || requestIds.length === 0) return;

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

          // Only show notification if this response is for one of the senior's requests
          if (!requestIds.includes(response.request_id)) return;
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-md w-full mx-4 text-center shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated ring icon */}
        <div className="relative mx-auto w-24 h-24 mb-6">
          <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-30" />
          <div className="absolute inset-2 bg-green-100 rounded-full animate-pulse" />
          <div className="relative w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
            <Phone className="w-10 h-10 text-white animate-bounce" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-2">Incoming Call!</h2>
        <p className="text-lg text-gray-600 mb-1">
          <span className="font-semibold text-indigo-600">{incomingCall.helperName}</span> is calling you
        </p>
        <p className="text-sm text-gray-500 mb-8">
          About: &ldquo;{incomingCall.requestTitle}&rdquo;
        </p>

        <div className="space-y-3">
          <button
            onClick={handleAnswer}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-lg shadow-green-500/20"
          >
            <Phone className="w-6 h-6" />
            Answer Call
          </button>
          <button
            onClick={handleDismiss}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
