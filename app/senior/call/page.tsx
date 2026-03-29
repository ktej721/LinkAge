'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function SeniorCallContent() {
  const searchParams = useSearchParams();
  const roomUrl = searchParams.get('url') || '';
  const router = useRouter();

  const [activeCallCode, setActiveCallCode] = useState<string | null>(null);

  useEffect(() => {
    if (roomUrl) {
      // Extract the Jitsi code assuming https://meet.jit.si/CODE format
      const codeMatch = roomUrl.split('meet.jit.si/');
      if (codeMatch.length > 1) {
        setActiveCallCode(codeMatch[1].split('#')[0]);
      }
    }
  }, [roomUrl]);

  const handleLeaveCall = () => {
    // If they manually click our red End Call button
    router.push('/senior/dashboard');
  };

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

  if (activeCallCode) {
    const jitsiConfigMap = [
      'userInfo.displayName="Senior"',
      'config.startWithVideoMuted=false',
      'config.startWithAudioMuted=false',
      'config.prejoinPageEnabled=false',
      'config.disableDeepLinking=true',
      // Hide Jitsi's internal hangup button so user must use our Leave Call button
      `config.toolbarButtons=["camera","chat","desktop","fullscreen","microphone","profile","raisehand","settings","tileview","videoquality"]`
    ].join('&');

    const iframeSrc = `https://meet.jit.si/${activeCallCode}#${jitsiConfigMap}`;

    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col">
        <div className="flex justify-between items-center p-4 bg-slate-900 text-white relative z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold truncate">Live Video Call</h1>
          </div>
          <button onClick={handleLeaveCall} className="bg-red-600 hover:bg-red-700 active:bg-red-800 px-6 py-3 rounded-2xl font-bold transition-colors senior-btn ring-4 ring-red-900">
            End Call
          </button>
        </div>
        <div className="flex-1 w-full bg-black relative">
          <iframe 
            src={iframeSrc}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-0 absolute inset-0"
            title="Live Video Call"
          />
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
            Please allow camera and microphone access when prompted.
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
