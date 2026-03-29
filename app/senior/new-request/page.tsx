'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import VoiceRecorder from '@/components/VoiceRecorder';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, Keyboard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Default to voice mode (primary path for seniors)
  const [mode, setMode] = useState<'voice' | 'text'>('voice');

  // Voice mode state
  const [voiceTitle, setVoiceTitle] = useState('Voice Auto-Request');
  const [voiceDescription, setVoiceDescription] = useState('');
  const [voiceLanguage, setVoiceLanguage] = useState('english');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Text mode state
  const [textTitle, setTextTitle] = useState('');
  const [textDescription, setTextDescription] = useState('');
  const [textLanguage, setTextLanguage] = useState('english');

  const uploadAudio = async (blob: Blob): Promise<string | null> => {
    try {
      const response = await fetch('/api/audio/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: 'recording.webm' }),
      });
      const json = await response.json();

      if (!response.ok || !json.signedUrl) {
        throw new Error(json.error || 'Failed to get upload URL');
      }

      const { path, signedUrl, token } = json;

      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': 'audio/webm',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text().catch(() => '');
        throw new Error(`Upload failed (${uploadRes.status}): ${errText}`);
      }
      return path;
    } catch (error) {
      return null;
    }
  };

  const handleVoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!audioBlob || audioBlob.size === 0) {
      toast.error('Please record your question by tapping the mic button first.');
      return;
    }

    setLoading(true);
    try {
      let audio_url = null;
      if (audioBlob) {
        audio_url = await uploadAudio(audioBlob);
      }

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: "Voice Message from Senior",
          description: voiceDescription.trim() || "A senior recorded a voice question. Please listen to the attached audio clip.",
          audio_url,
          language: voiceLanguage,
          category: 'general',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Your question has been posted!');
      router.push('/senior/my-requests');
    } catch (error: any) {
      toast.error(error.message || 'Failed to post request');
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textTitle.trim() || !textDescription.trim()) {
      toast.error('Please fill in your question.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: textTitle.trim(),
          description: textDescription.trim(),
          audio_url: null,
          language: textLanguage,
          category: 'general',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Your question has been posted!');
      router.push('/senior/my-requests');
    } catch (error: any) {
      toast.error(error.message || 'Failed to post request');
    } finally {
      setLoading(false);
    }
  };

  // ======= VOICE MODE (default) =======
  if (mode === 'voice') {
    return (
      <div className="space-y-5">
        {/* Header with back */}
        <div>
          <Link href="/senior/dashboard" className="inline-flex items-center gap-1 text-slate-400 text-sm font-medium mb-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900">Ask a Question</h1>
          <p className="text-base text-slate-500 mt-1">Tap the mic and speak your question</p>
        </div>

        {/* Voice Recorder — full width, prominent */}
        <div className="bg-white rounded-2xl p-5 border-2 border-slate-200 senior-card">
          <label className="block text-base font-bold text-slate-900 mb-4">
            Step 1: Record your question
          </label>
          <VoiceRecorder
            onAudioBlob={setAudioBlob}
          />
        </div>

        {/* Form elements for voice submission (minimal since text is hidden) */}
        <form onSubmit={handleVoiceSubmit} className="bg-white rounded-2xl p-5 border-2 border-slate-200 space-y-5 senior-card">
          <p className="text-base font-bold text-slate-900">Step 2: Review &amp; send</p>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-amber-800 text-sm font-medium">
              💡 Your voice recording will be securely attached. You don't need to type anything!
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="voice-description" className="text-base font-bold text-slate-800">Additional Text (Optional)</Label>
            <Textarea
              id="voice-description"
              value={voiceDescription}
              onChange={e => setVoiceDescription(e.target.value)}
              placeholder="You can add any typed details here if needed..."
              className="text-base p-4 min-h-[100px] rounded-xl border-slate-300 font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voice-language" className="text-base font-bold text-slate-800">Language</Label>
            <Select value={voiceLanguage} onValueChange={(val) => setVoiceLanguage(val || 'english')}>
              <SelectTrigger className="text-base h-14 rounded-xl capitalize border-slate-300 font-medium">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="hindi">Hindi</SelectItem>
                <SelectItem value="tamil">Tamil</SelectItem>
                <SelectItem value="telugu">Telugu</SelectItem>
                <SelectItem value="kannada">Kannada</SelectItem>
                <SelectItem value="malayalam">Malayalam</SelectItem>
                <SelectItem value="marathi">Marathi</SelectItem>
                <SelectItem value="bengali">Bengali</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full text-lg h-16 rounded-2xl bg-amber-600 active:bg-amber-700 shadow-md font-extrabold tracking-wide senior-btn"
          >
            {loading ? 'Submitting...' : 'Submit Question'}
          </Button>
        </form>

        {/* Switch to text mode — subtle */}
        <div className="text-center pb-2">
          <button
            onClick={() => setMode('text')}
            className="text-slate-400 active:text-slate-600 text-sm font-medium transition-colors inline-flex items-center gap-1.5"
          >
            <Keyboard className="w-4 h-4" />
            Prefer typing? Switch to text mode
          </button>
        </div>
      </div>
    );
  }

  // ======= TEXT MODE =======
  return (
    <div className="space-y-5">
      <div>
        <Link href="/senior/dashboard" className="inline-flex items-center gap-1 text-slate-400 text-sm font-medium mb-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900">Ask by Typing</h1>
        <p className="text-base text-slate-500 mt-1">Type your question, or use voice typing to dictate.</p>
      </div>

      <form onSubmit={handleTextSubmit} className="bg-white rounded-2xl p-5 border-2 border-slate-200 space-y-5 senior-card">
        <div className="space-y-2">
          <Label htmlFor="text-title" className="text-base font-bold text-slate-800">Short Summary</Label>
          <Input
            id="text-title"
            value={textTitle}
            onChange={e => setTextTitle(e.target.value)}
            placeholder="e.g. How to pay electricity bill online?"
            className="text-base h-14 rounded-xl border-slate-300 font-medium"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="text-description" className="text-base font-bold text-slate-800">Your Question</Label>
          <Textarea
            id="text-description"
            value={textDescription}
            onChange={e => setTextDescription(e.target.value)}
            placeholder="Explain what you need help with..."
            className="text-base p-4 min-h-[130px] rounded-xl border-slate-300 font-medium"
            required
          />
        </div>



        <div className="space-y-2">
          <Label htmlFor="text-language" className="text-base font-bold text-slate-800">Language</Label>
          <Select value={textLanguage} onValueChange={(val) => setTextLanguage(val || 'english')}>
            <SelectTrigger className="text-base h-14 rounded-xl capitalize border-slate-300 font-medium">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="hindi">Hindi</SelectItem>
              <SelectItem value="tamil">Tamil</SelectItem>
              <SelectItem value="telugu">Telugu</SelectItem>
              <SelectItem value="kannada">Kannada</SelectItem>
              <SelectItem value="malayalam">Malayalam</SelectItem>
              <SelectItem value="marathi">Marathi</SelectItem>
              <SelectItem value="bengali">Bengali</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full text-lg h-16 rounded-2xl bg-amber-600 active:bg-amber-700 shadow-md font-extrabold tracking-wide senior-btn"
        >
          {loading ? 'Submitting...' : 'Post Question'}
        </Button>
      </form>

      {/* Switch to voice mode */}
      <div className="text-center pb-2">
        <button
          onClick={() => setMode('voice')}
          className="text-slate-400 active:text-slate-600 text-sm font-medium transition-colors flex items-center gap-1.5 mx-auto"
        >
          <Mic className="w-4 h-4" />
          Switch to voice mode
        </button>
      </div>
    </div>
  );
}
