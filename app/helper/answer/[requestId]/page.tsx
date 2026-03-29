'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import VideoRecorder from '@/components/VideoRecorder';
import { Globe, Loader2, Video, FileText, UserCircle2, Phone, Mic } from 'lucide-react';
import Link from 'next/link';
import { Request } from '@/types';

export default function AnswerRequestPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.requestId as string;

  const [request, setRequest] = useState<Request | null>(null);
  const [signedAudioUrl, setSignedAudioUrl] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoTextSummary, setVideoTextSummary] = useState('');
  const [textContent, setTextContent] = useState('');

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const res = await fetch(`/api/requests/${requestId}`);
        const json = await res.json();
        
        if (!res.ok) throw new Error(json.error);
        setRequest(json.data);

        if (json.data.audio_url) {
          try {
            const audioRes = await fetch('/api/audio/signed-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: json.data.audio_url }),
            });
            const audioJson = await audioRes.json();
            if (audioRes.ok && audioJson.signedUrl) {
              setSignedAudioUrl(audioJson.signedUrl);
            }
          } catch {
            // Audio URL fetch failed — non-critical
          }
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to load request');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  const uploadVideo = async (blob: Blob): Promise<string | null> => {
    try {
      const blobType = blob.type || 'video/webm';
      const fileName = (blob as File).name || 'response.webm';
      
      const response = await fetch('/api/responses/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: fileName, contentType: blobType }),
      });
      const json = await response.json();

      if (!response.ok || !json.signedUrl) {
        throw new Error(json.error || 'Failed to get upload URL');
      }

      const { path, signedUrl, token, contentType: resolvedContentType } = json;
      const uploadContentType = resolvedContentType || blobType || 'video/webm';

      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': uploadContentType,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text().catch(() => '');
        throw new Error(`Upload failed (${uploadRes.status}): ${errText}`);
      }
      return path;
    } catch (error: any) {
      toast.error(error.message || 'Video upload failed');
      return null;
    }
  };

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoBlob || videoBlob.size === 0) {
      toast.error('Please record a video first.');
      return;
    }

    setSubmitting(true);
    try {
      const video_url = await uploadVideo(videoBlob);
      if (!video_url) throw new Error('Video upload failed');

      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          video_url,
          text_content: videoTextSummary,
          response_type: 'video',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Answer submitted! Our team will review your video.');
      router.push('/helper/browse');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim()) {
      toast.error('Please write an answer.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          text_content: textContent,
          response_type: 'text',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Answer submitted successfully!');
      router.push('/helper/browse');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!request) return <div className="text-center py-10 text-slate-500">Request not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Request Details */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden group border-white/60">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400 rounded-full mix-blend-multiply filter blur-[50px] opacity-10 group-hover:opacity-30 transition-opacity"></div>
        <div className="relative z-10">
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-4 font-medium">
          <UserCircle2 className="w-5 h-5 text-amber-500" />
          <span>{request.senior?.name} asks:</span>
          <span className="mx-2">·</span>
          <Globe className="w-4 h-4" />
          <span className="capitalize">{request.language}</span>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-3">{request.title}</h1>
        <p className="text-base text-slate-600 whitespace-pre-wrap">{request.description}</p>
        
        {request.audio_url && (
          <div className="mt-5 bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Voice recording attached
            </p>
            {signedAudioUrl ? (
              <audio controls src={signedAudioUrl} className="w-full" />
            ) : (
              <p className="text-sm text-slate-400 italic">Loading audio...</p>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Answer Area */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden shadow-2xl shadow-amber-900/5 border-white/60">
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-400 rounded-full mix-blend-multiply filter blur-[60px] opacity-10 pointer-events-none"></div>
        <h2 className="text-lg font-bold text-slate-900 mb-6">Provide your answer</h2>

        <Tabs defaultValue="video" className="w-full relative z-10">
          <TabsList className="w-full grid grid-cols-3 mb-6 bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/60 shadow-inner">
            <TabsTrigger value="video" className="rounded-xl py-3 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-md transition-all">
              <Video className="w-4 h-4 mr-2 inline" /> Video
            </TabsTrigger>
            <TabsTrigger value="text" className="rounded-xl py-3 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-md transition-all">
              <FileText className="w-4 h-4 mr-2 inline" /> Text
            </TabsTrigger>
            <TabsTrigger value="call" className="rounded-xl py-3 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-md transition-all">
              <Phone className="w-4 h-4 mr-2 inline" /> Live Call
            </TabsTrigger>
          </TabsList>
          
           <TabsContent value="video" className="space-y-5">
            <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-100 text-sm">
              Record a short, clear video explaining the solution. Your video will be reviewed before being shown to the senior.
            </div>

            <form onSubmit={handleVideoSubmit} className="space-y-5">
              <div className="flex justify-center rounded-3xl p-1 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-400">
                <div className="flex justify-center w-full bg-white/90 backdrop-blur-md rounded-[1.35rem] p-4 text-center items-center h-full">
                  <VideoRecorder onVideoBlob={setVideoBlob} maxDurationSeconds={180} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-600">Text summary (optional)</label>
                <Textarea 
                  value={videoTextSummary}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setVideoTextSummary(e.target.value)}
                  placeholder="e.g., Here are the 3 steps I mentioned in the video..." 
                  className="min-h-[80px] resize-y rounded-2xl border-white/60 bg-white/50 backdrop-blur-sm shadow-inner focus-visible:ring-amber-500/50"
                />
              </div>

              <div className="relative group/btn">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-rose-500 rounded-2xl blur-md opacity-40 group-hover/btn:opacity-80 transition-opacity"></div>
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={submitting || !videoBlob} 
                  className="w-full text-base h-16 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:to-rose-500 text-white font-extrabold shadow-xl border border-white/20 transition-all hover:scale-[1.02] relative z-10"
                >
                  {submitting ? 'Uploading...' : 'Submit Video Answer'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="text" className="space-y-5">
            <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-100 text-sm">
              Written answers go live immediately to help seniors. Make your instructions clear and easy to follow.
            </div>

            <form onSubmit={handleTextSubmit} className="space-y-5">
              <div className="space-y-2">
                <Textarea 
                  value={textContent}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTextContent(e.target.value)}
                  placeholder="Type your detailed, step-by-step answer here..." 
                  className="min-h-[200px] text-base p-5 rounded-3xl border-white/60 bg-white/50 backdrop-blur-sm shadow-inner focus-visible:ring-amber-500/50"
                  required
                />
              </div>

              <div className="relative group/btn">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-rose-500 rounded-2xl blur-md opacity-40 group-hover/btn:opacity-80 transition-opacity"></div>
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={submitting} 
                  className="w-full text-base h-16 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:to-rose-500 text-white font-extrabold shadow-xl border border-white/20 transition-all hover:scale-[1.02] relative z-10"
                >
                  {submitting ? 'Submitting...' : 'Post Written Answer'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="call" className="space-y-5">
            <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-100 text-sm">
              Start a free live video call with the senior using Jitsi Meet. No accounts needed — just click and connect.
            </div>

            <div className="text-center py-8 space-y-5">
              <div className="bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <Phone className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Ready to help live?</h3>
                <p className="text-slate-500 max-w-sm mx-auto text-sm">The senior will receive a notification and can join the call instantly.</p>
              </div>
              <div className="relative group/btn call">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-rose-500 rounded-2xl blur-md opacity-40 group-hover/btn:opacity-80 transition-opacity"></div>
              <Link href={`/helper/call/${requestId}`} className="block w-full relative z-10">
                <Button size="lg" className="w-full text-base h-16 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:to-rose-500 text-white gap-2 font-extrabold shadow-xl border border-white/20 transition-all hover:scale-[1.02]">
                  <Phone className="w-5 h-5" />
                  Start Live Video Call
                </Button>
              </Link>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

