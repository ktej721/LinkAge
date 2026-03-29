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
  const [activeCallCode, setActiveCallCode] = useState<string | null>(null);
  const [showClosePrompt, setShowClosePrompt] = useState(false);

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
        throw new Error('Failed to start call');
      }
      toast.success('Call room created! Joining directly...');
      setActiveCallCode(code);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start call');
    } finally {
      setSaving(false);
    }
  };

  const markClosedAndLeave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      });
      toast.success('Request closed successfully.');
    } catch (e) {
      console.error(e);
    }
    router.push('/helper/dashboard');
  };

  const justLeave = () => {
    router.push('/helper/dashboard');
  };

  if (activeCallCode) {
    const jitsiConfigMap = [
      'userInfo.displayName="Helper"',
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
        {showClosePrompt && (
          <div className="absolute inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-6 animate-in zoom-in-95">
              <h2 className="text-2xl font-bold text-slate-900">Call Ended</h2>
              <p className="text-slate-600">Did you successfully help the senior? Choose an option to close this task.</p>
              <div className="space-y-3">
                <Button onClick={markClosedAndLeave} disabled={saving} className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 text-white rounded-xl">
                  {saving ? <Loader2 className="animate-spin w-5 h-5 mx-auto"/> : "Yes, Mark request as Resolved"}
                </Button>
                <Button onClick={justLeave} variant="outline" className="w-full h-14 text-lg border-2 border-slate-200 text-slate-700 rounded-xl">
                  No, I just left the call
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center p-4 bg-slate-900 text-white relative z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold truncate">Live Call: {requestTitle || 'Request'}</h1>
          </div>
          <Button variant="destructive" onClick={() => setShowClosePrompt(true)} className="rounded-xl font-bold px-6">
            Leave Call
          </Button>
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="rounded-xl">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Live Video Call</h1>
          {requestTitle && (
            <p className="text-gray-500 mt-1 text-sm">For: {requestTitle}</p>
          )}
        </div>
      </div>

      <div className="glass-card rounded-3xl p-8 sm:p-10 text-center space-y-8 border-white/60 relative overflow-hidden">
        <div className="bg-amber-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <Video className="w-12 h-12 text-amber-500" />
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">Start a Live Video Call</h2>
          <p className="text-slate-600 text-lg max-w-md mx-auto">
            Connect face-to-face with the senior to help them in real-time.
            A free private room will be created, and the senior will be notified.
          </p>
        </div>

        <div className="bg-amber-50/80 border border-amber-200/50 rounded-xl p-4 max-w-md mx-auto backdrop-blur-sm">
          <p className="text-amber-800 text-sm flex items-start gap-2">
            <span className="text-lg">💡</span>
            <span>The secure call will open directly on this screen. Please allow camera and microphone access when prompted.</span>
          </p>
        </div>

        <div className="relative group/btn mx-auto max-w-sm">
           <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-rose-500 rounded-2xl blur-md opacity-40 group-hover/btn:opacity-80 transition-opacity"></div>
          <Button
            onClick={handleStartCall}
            disabled={saving}
            size="lg"
            className="w-full text-xl h-16 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:to-rose-500 text-white font-extrabold shadow-xl border border-white/20 transition-all hover:scale-[1.02] relative z-10 gap-3"
          >
            {saving ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Setting up room...
              </>
            ) : (
              <>
                <Phone className="w-6 h-6 fill-current" />
                Start Call Now
              </>
            )}
          </Button>
        </div>

        <p className="text-slate-500 text-sm font-medium">
          The senior will receive a notification to join the call instantly.
        </p>
      </div>
    </div>
  );
}
