'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function SeniorCallContent() {
  const searchParams = useSearchParams();
  const roomUrl = searchParams.get('url') || '';

  useEffect(() => {
    if (roomUrl) {
      // Extract the Jitsi code
      const codeMatch = roomUrl.split('meet.jit.si/');
      if (codeMatch.length > 1) {
        const activeCallCode = codeMatch[1].split('#')[0];
        
        const origin = window.location.origin;
        const jitsiConfigMap = [
          'userInfo.displayName="Senior"',
          'config.startWithVideoMuted=false',
          'config.startWithAudioMuted=false',
          `config.postLogoutUrl="${origin}/senior/dashboard"`
        ].join('&');
        
        // Wait a small moment, then redirect natively to Jitsi room to avoid mobile browser WebRTC/Cookie blocks
        setTimeout(() => {
          window.location.href = `https://meet.jit.si/${activeCallCode}#${jitsiConfigMap}`;
        }, 500);
      }
    }
  }, [roomUrl]);

  if (!roomUrl) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">😕</div>
          <h1 className="text-2xl font-bold text-gray-900">No call found</h1>
          <p className="text-gray-600">The call link might have expired or is invalid.</p>
          <a
            href="/senior/my-requests"
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors senior-btn"
          >
            ← Back to My Requests
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white text-center p-8">
      <div className="max-w-lg mx-auto space-y-8">
        <div className="relative inline-block">
          <div className="text-8xl animate-bounce">📞</div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold">Connecting you...</h1>
          <p className="text-gray-300 text-xl">
            Entering the secure video room.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 text-amber-300">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-xl font-medium">Initializing Call...</span>
        </div>
      </div>
    </div>
  );
}

export default function SeniorCallPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
          <div className="flex items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <span className="text-2xl font-bold">Connecting...</span>
          </div>
        </div>
      }
    >
      <SeniorCallContent />
    </Suspense>
  );
}
