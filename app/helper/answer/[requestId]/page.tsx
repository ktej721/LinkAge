'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import VideoRecorder from '@/components/VideoRecorder';
import { Globe, Loader2, Video, FileText, UserCircle2, Phone } from 'lucide-react';
import Link from 'next/link';
import { Request } from '@/types';

export default function AnswerRequestPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.requestId as string;

  const [request, setRequest] = useState<Request | null>(null);
  const [signedAudioUrl, setSignedAudioUrl] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [textContent, setTextContent] = useState('');

  useEffect(() => {
    // We need current user to know if they are KYC verified
    const fetchUserAndRequest = async () => {
      try {
        // Fetch current user from session endpoint if we had one, 
        // Or we can rely on catching 401. But to selectively show UI, we need user object.
        // We'll decode the JWT or create a quick /api/auth/me if needed, 
        // but we can also just fetch the request and assume the text tab submission will fail if not KYC.
        // Actually, we can check localStorage or add a small check in the API, but let's just show it and let server validate,
        // OR better, we know user from cookies, but this is a client component. 
        // For simplicity, we'll try to get user data if we had an endpoint. Since we don't, 
        // we will fetch the request and look at the layout passing user, but Next.js app router doesn't easily pass it to deeply nested client components unless through context.
        // Let's just fetch the request for now.
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
          } catch (err) {
            console.error('Failed to fetch signed audio URL:', err);
          }
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to load request');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndRequest();
  }, [requestId]);

  const uploadVideo = async (blob: Blob): Promise<string | null> => {
    try {
      console.log('[uploadVideo] Starting upload, blob size:', blob.size, 'type:', blob.type);
      
      // Detect the actual file type and name
      const blobType = blob.type || 'video/webm';
      // If the blob is a File (from file upload), use its name; otherwise default
      const fileName = (blob as File).name || 'response.webm';
      
      const response = await fetch('/api/responses/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: fileName, contentType: blobType }),
      });
      const json = await response.json();
      console.log('[uploadVideo] Upload URL response:', JSON.stringify(json));

      if (!response.ok || !json.signedUrl) {
        throw new Error(json.error || 'Failed to get upload URL');
      }

      const { path, signedUrl, token, contentType: resolvedContentType } = json;
      const uploadContentType = resolvedContentType || blobType || 'video/webm';
      console.log('[uploadVideo] Got signed URL, uploading with contentType:', uploadContentType);

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
        console.error('[uploadVideo] PUT failed:', uploadRes.status, errText);
        throw new Error(`Upload failed (${uploadRes.status}): ${errText}`);
      }
      console.log('[uploadVideo] Upload successful, path:', path);
      return path;
    } catch (error: any) {
      console.error('Video upload error:', error);
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
          text_content: textContent,
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
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!request) return <div className="text-center py-10">Request not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Request Details */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 font-medium">
          <UserCircle2 className="w-5 h-5 text-orange-500" />
          <span>{request.senior?.name} asks:</span>
          <span className="mx-2">•</span>
          <Globe className="w-4 h-4" />
          <span className="capitalize">{request.language}</span>
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{request.title}</h1>
        <p className="text-lg text-gray-700 whitespace-pre-wrap">{request.description}</p>
        
        {request.audio_url && (
          <div className="mt-6 bg-red-50 rounded-xl p-4 border border-red-200">
            <p className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
              🎙️ This question was asked via voice recording
            </p>
            {signedAudioUrl ? (
              <audio controls src={signedAudioUrl} className="w-full" />
            ) : (
              <p className="text-sm text-gray-500 italic">Loading audio...</p>
            )}
          </div>
        )}
      </div>

      {/* Answer Area */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Provide your answer</h2>

        <Tabs defaultValue="video" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-8 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="video" className="rounded-lg py-2.5 text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Video className="w-4 h-4 mr-2 inline" /> Video
            </TabsTrigger>
            <TabsTrigger value="text" className="rounded-lg py-2.5 text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <FileText className="w-4 h-4 mr-2 inline" /> Text
            </TabsTrigger>
            <TabsTrigger value="call" className="rounded-lg py-2.5 text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Phone className="w-4 h-4 mr-2 inline" /> Live Call
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="video" className="space-y-6">
            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 flex items-start gap-3 text-sm">
              <div className="mt-0.5">ℹ️</div>
              <p>For the best experience, record a short, clear video explaining the solution. <strong>Your video will be reviewed by our team before being shown to the senior.</strong></p>
            </div>

            <form onSubmit={handleVideoSubmit} className="space-y-6">
              <div className="flex justify-center border-2 border-dashed border-gray-200 rounded-2xl p-4 bg-slate-50">
                <VideoRecorder onVideoBlob={setVideoBlob} maxDurationSeconds={180} />
              </div>

              <div className="space-y-3">
                <label className="block font-medium text-gray-700">Add a short text summary (Optional)</label>
                <Textarea 
                  value={textContent}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTextContent(e.target.value)}
                  placeholder="e.g., Here are the 3 steps I mentioned in the video..." 
                  className="min-h-[100px] resize-y rounded-xl"
                />
              </div>

              <Button 
                type="submit" 
                size="lg" 
                disabled={submitting || !videoBlob} 
                className="w-full text-lg py-6 rounded-xl bg-indigo-600 hover:bg-indigo-700"
              >
                {submitting ? 'Uploading...' : 'Submit Video Answer'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="text" className="space-y-6">
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 flex items-start gap-3 text-sm">
              <div className="mt-0.5">🔒</div>
              <p>Written answers go live immediately to help seniors. Ensure your instructions are clear and easy to follow.</p>
            </div>

            <form onSubmit={handleTextSubmit} className="space-y-6">
              <div className="space-y-3">
                <Textarea 
                  value={textContent}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTextContent(e.target.value)}
                  placeholder="Type your detailed, step-by-step answer here..." 
                  className="min-h-[200px] text-lg p-5 rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <Button 
                type="submit" 
                size="lg" 
                disabled={submitting} 
                className="w-full text-lg py-6 rounded-xl bg-indigo-600 hover:bg-indigo-700"
              >
                {submitting ? 'Submitting...' : 'Post Written Answer'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="call" className="space-y-6">
            <div className="bg-indigo-50 text-indigo-800 p-4 rounded-xl border border-indigo-100 flex items-start gap-3 text-sm">
              <div className="mt-0.5">📹</div>
              <p>Start a <strong>free live video call</strong> with the senior using Jitsi Meet. No accounts needed — just click and connect face-to-face in real time.</p>
            </div>

            <div className="text-center py-8 space-y-6">
              <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <Phone className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to help live?</h3>
                <p className="text-gray-600 max-w-sm mx-auto">The senior will receive a notification and can join the call instantly.</p>
              </div>
              <Link href={`/helper/call/${requestId}`}>
                <Button size="lg" className="text-lg py-6 px-10 rounded-xl bg-green-600 hover:bg-green-700 gap-2">
                  <Phone className="w-5 h-5" />
                  Start Live Video Call
                </Button>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
