'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Phone, Loader2 } from 'lucide-react';

function SeniorCallContent() {
  const searchParams = useSearchParams();
  const roomUrl = searchParams.get('url') || '';

  useEffect(() => {
    if (roomUrl) {
      // Redirect IMMEDIATELY to Jitsi (HTTPS) — bypasses WebRTC block on HTTP LAN
      window.location.href = `${roomUrl}#userInfo.displayName="Senior"&config.startWithVideoMuted=false&config.startWithAudioMuted=false`;
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
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
          >
            ← Back to My Requests
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 text-white text-center p-8">
      <div className="max-w-lg mx-auto space-y-8">
        <div className="relative inline-block">
          <div className="text-8xl animate-bounce">📞</div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold">Connecting you...</h1>
          <p className="text-gray-300 text-xl">
            Redirecting to secure video call. Please allow camera and microphone access.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 text-indigo-300">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-lg">Opening Jitsi Meet...</span>
        </div>

        {/* Manual fallback button in case auto-redirect fails */}
        <a
          href={`${roomUrl}#userInfo.displayName="Senior"&config.startWithVideoMuted=false&config.startWithAudioMuted=false`}
          className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 font-bold py-5 px-10 rounded-2xl text-2xl transition-all hover:scale-105 shadow-lg shadow-green-500/30"
        >
          <Phone className="w-7 h-7" />
          Open Video Call
        </a>

        <p className="text-gray-500 text-sm">
          If the call doesn&apos;t open automatically, tap the button above.
        </p>
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
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xl">Connecting...</span>
          </div>
        </div>
      }
    >
      <SeniorCallContent />
    </Suspense>
  );
}
