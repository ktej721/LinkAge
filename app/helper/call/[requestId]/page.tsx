'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Video, ArrowLeft, Phone, Loader2, ExternalLink } from 'lucide-react';

export default function HelperCallPage() {
  const { requestId } = useParams();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const res = await fetch(`/api/requests/${requestId}`);
        const json = await res.json();
        if (res.ok && json.data) {
          setRequestTitle(json.data.title);
        }
      } catch {}
    };
    fetchRequest();
  }, [requestId]);

  const handleStartCall = async () => {
    const code = `linkage-${(requestId as string).substring(0, 8)}-${Date.now().toString(36)}`;
    const jitsiUrl = `https://meet.jit.si/${code}`;
    setSaving(true);

    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          response_type: 'video_call',
          call_url: jitsiUrl,
          text_content: `Live video call started. Join at: ${jitsiUrl}`,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to start call');
      }
      toast.success('Call room created! Redirecting you to Jitsi...');

      // Redirect helper directly to Jitsi HTTPS — bypasses WebRTC block on HTTP LAN
      window.location.href = `${jitsiUrl}#userInfo.displayName="Helper"&config.startWithVideoMuted=false&config.startWithAudioMuted=false`;
    } catch (err: any) {
      toast.error(err.message || 'Failed to start call');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="rounded-xl">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📹 Live Video Call</h1>
          {requestTitle && (
            <p className="text-gray-500 mt-1 text-sm">For: {requestTitle}</p>
          )}
        </div>
      </div>

      {/* Pre-call setup */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-200 shadow-sm text-center space-y-8">
        <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
          <Video className="w-12 h-12 text-indigo-600" />
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">Start a Live Video Call</h2>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            Connect face-to-face with the senior to help them in real-time.
            A free Jitsi Meet room will be created, and the senior will be notified.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-md mx-auto">
          <p className="text-amber-800 text-sm flex items-start gap-2">
            <span className="text-lg">💡</span>
            <span>You will be redirected to a secure Jitsi Meet page. Allow camera and microphone access when prompted.</span>
          </p>
        </div>

        <Button
          onClick={handleStartCall}
          disabled={saving}
          size="lg"
          className="w-full max-w-sm text-xl py-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg gap-3"
        >
          {saving ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Setting up room...
            </>
          ) : (
            <>
              <Phone className="w-6 h-6" />
              Start Call Now
              <ExternalLink className="w-4 h-4 ml-1 opacity-60" />
            </>
          )}
        </Button>

        <p className="text-gray-400 text-sm">
          The senior will receive a real-time notification to join the call.
        </p>
      </div>
    </div>
  );
}
