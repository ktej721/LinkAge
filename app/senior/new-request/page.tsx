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
import { Mic, FileText, Keyboard } from 'lucide-react';

export default function NewRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Which mode the senior chose
  const [mode, setMode] = useState<'choose' | 'voice' | 'text'>('choose');

  // Voice mode state
  const [voiceTitle, setVoiceTitle] = useState('');
  const [voiceDescription, setVoiceDescription] = useState('');
  const [voiceLanguage, setVoiceLanguage] = useState('english');
  const [voiceCategory, setVoiceCategory] = useState('general');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Text mode state
  const [textTitle, setTextTitle] = useState('');
  const [textDescription, setTextDescription] = useState('');
  const [textLanguage, setTextLanguage] = useState('english');
  const [textCategory, setTextCategory] = useState('general');

  // Voice typing for text mode — appends dictated text to textDescription
  const handleVoiceTyping = (text: string) => {
    setTextDescription(prev => prev ? `${prev} ${text}` : text);
    // Auto-fill title from first few words if empty
    if (!textTitle && text) {
      const words = text.split(' ');
      setTextTitle(words.slice(0, 6).join(' ') + (words.length > 6 ? '...' : ''));
    }
  };

  // Handle voice transcript from full voice recorder
  const handleVoiceTranscript = (text: string) => {
    setVoiceDescription(text);
    // Auto-generate title from first few words if empty
    if (!voiceTitle && text) {
      const words = text.split(' ');
      setVoiceTitle(words.slice(0, 6).join(' ') + (words.length > 6 ? '...' : ''));
    }
  };

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
      console.error('Audio upload error:', error);
      return null;
    }
  };

  const handleVoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = voiceTitle.trim();
    const description = voiceDescription.trim();

    if (!title || !description) {
      toast.error('Please record your question by tapping the mic button. We need to hear your question!');
      return;
    }

    setLoading(true);
    try {
      let audio_url = null;
      if (audioBlob) {
        audio_url = await uploadAudio(audioBlob);
        if (!audio_url) {
          toast.error('Audio upload failed, but we still have your text. Submitting...');
        }
      }

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          audio_url,
          language: voiceLanguage,
          category: voiceCategory,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Your voice question has been posted successfully!');
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
      toast.error('Please fill in the title and your question.');
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
          category: textCategory,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Your question has been posted successfully!');
      router.push('/senior/my-requests');
    } catch (error: any) {
      toast.error(error.message || 'Failed to post request');
    } finally {
      setLoading(false);
    }
  };

  // ======= MODE CHOOSE SCREEN =======
  if (mode === 'choose') {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">What do you need help with?</h1>
          <p className="text-xl text-gray-600">Choose how you&apos;d like to ask your question</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Voice Option */}
          <button
            onClick={() => setMode('voice')}
            className="group bg-white rounded-3xl p-8 shadow-sm border-2 border-gray-200 hover:border-red-400 hover:shadow-lg transition-all duration-300 text-left"
          >
            <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-red-200 transition-colors">
              <Mic className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🎙️ Ask by Voice</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Just tap the mic and speak your question. We&apos;ll record your voice and convert it to text automatically.
            </p>
            <p className="text-red-600 font-semibold mt-4 text-base">Best for quick, easy questions →</p>
          </button>

          {/* Text Option */}
          <button
            onClick={() => setMode('text')}
            className="group bg-white rounded-3xl p-8 shadow-sm border-2 border-gray-200 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 text-left"
          >
            <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-indigo-200 transition-colors">
              <FileText className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">✍️ Ask by Typing</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Type your question with details. You can also use voice typing to dictate instead of pressing keys.
            </p>
            <p className="text-indigo-600 font-semibold mt-4 text-base">Best for detailed questions →</p>
          </button>
        </div>
      </div>
    );
  }

  // ======= VOICE MODE SCREEN =======
  if (mode === 'voice') {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setMode('choose')} className="rounded-xl px-4 py-2 text-base">
            ← Back
          </Button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">🎙️ Ask by Voice</h1>
            <p className="text-lg text-gray-600 mt-1">Tap the mic, speak your question, and we&apos;ll do the rest.</p>
          </div>
        </div>

        {/* Voice Recorder */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200">
          <label className="block text-xl font-semibold text-gray-900 mb-4">
            Record your question
          </label>
          <VoiceRecorder
            onTranscript={handleVoiceTranscript}
            onAudioBlob={setAudioBlob}
            language={voiceLanguage}
            mode="full"
          />
        </div>

        {/* Auto-filled details */}
        <form onSubmit={handleVoiceSubmit} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-6">
          <div className="space-y-3">
            <Label htmlFor="voice-title" className="text-xl font-semibold">Short Summary (Title)</Label>
            <Input
              id="voice-title"
              value={voiceTitle}
              onChange={e => setVoiceTitle(e.target.value)}
              placeholder="Auto-filled from your voice, or type manually"
              className="text-xl py-8 rounded-xl"
              required
            />
            <p className="text-sm text-gray-500">This is auto-generated from your voice. You can edit it.</p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="voice-description" className="text-xl font-semibold">Your Question (Transcribed)</Label>
            <Textarea
              id="voice-description"
              value={voiceDescription}
              onChange={e => setVoiceDescription(e.target.value)}
              placeholder="Your spoken question will appear here..."
              className="text-xl p-4 min-h-[120px] rounded-xl"
              required
            />
            <p className="text-sm text-gray-500">This is what we heard. You can correct any mistakes.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <div className="space-y-3">
              <Label htmlFor="voice-category" className="text-xl font-semibold">Category</Label>
              <Select value={voiceCategory} onValueChange={(val) => setVoiceCategory(val || 'general')}>
                <SelectTrigger className="text-xl py-8 rounded-xl">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology & Devices</SelectItem>
                  <SelectItem value="health">Health Information</SelectItem>
                  <SelectItem value="government">Government Forms</SelectItem>
                  <SelectItem value="shopping">Online Shopping</SelectItem>
                  <SelectItem value="education">Learning/Education</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="general">General Help</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="voice-language" className="text-xl font-semibold">Language</Label>
              <Select value={voiceLanguage} onValueChange={(val) => setVoiceLanguage(val || 'english')}>
                <SelectTrigger className="text-xl py-8 rounded-xl capitalize">
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
          </div>

          <div className="pt-8">
            <Button
              type="submit"
              disabled={loading}
              className="w-full text-2xl py-8 rounded-2xl bg-red-600 hover:bg-red-700 shadow-md"
            >
              {loading ? 'Submitting...' : '🎙️ Submit Voice Question'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // ======= TEXT MODE SCREEN =======
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => setMode('choose')} className="rounded-xl px-4 py-2 text-base">
          ← Back
        </Button>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">✍️ Ask by Typing</h1>
          <p className="text-lg text-gray-600 mt-1">Type your question, or use voice typing to dictate.</p>
        </div>
      </div>

      <form onSubmit={handleTextSubmit} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-6">
        <div className="space-y-3">
          <Label htmlFor="text-title" className="text-xl font-semibold">Short Summary (Title)</Label>
          <Input
            id="text-title"
            value={textTitle}
            onChange={e => setTextTitle(e.target.value)}
            placeholder="e.g. How to pay electricity bill online?"
            className="text-xl py-8 rounded-xl"
            required
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="text-description" className="text-xl font-semibold">Detailed Question</Label>
          <Textarea
            id="text-description"
            value={textDescription}
            onChange={e => setTextDescription(e.target.value)}
            placeholder="Please explain what you need help with..."
            className="text-xl p-4 min-h-[150px] rounded-xl"
            required
          />
        </div>

        {/* Voice Typing helper */}
        <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-200">
          <div className="flex items-center gap-2 mb-3">
            <Keyboard className="w-5 h-5 text-indigo-600" />
            <span className="text-base font-semibold text-indigo-700">Don&apos;t want to type? Use Voice Typing!</span>
          </div>
          <p className="text-sm text-indigo-600 mb-4">Tap the button below and speak — your words will be typed into the question box above.</p>
          <VoiceRecorder
            onTranscript={handleVoiceTyping}
            language={textLanguage}
            mode="dictation"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
          <div className="space-y-3">
            <Label htmlFor="text-category" className="text-xl font-semibold">Category</Label>
            <Select value={textCategory} onValueChange={(val) => setTextCategory(val || 'general')}>
              <SelectTrigger className="text-xl py-8 rounded-xl">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technology">Technology & Devices</SelectItem>
                <SelectItem value="health">Health Information</SelectItem>
                <SelectItem value="government">Government Forms</SelectItem>
                <SelectItem value="shopping">Online Shopping</SelectItem>
                <SelectItem value="education">Learning/Education</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="general">General Help</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="text-language" className="text-xl font-semibold">Language</Label>
            <Select value={textLanguage} onValueChange={(val) => setTextLanguage(val || 'english')}>
              <SelectTrigger className="text-xl py-8 rounded-xl capitalize">
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
        </div>

        <div className="pt-8">
          <Button
            type="submit"
            disabled={loading}
            className="w-full text-2xl py-8 rounded-2xl bg-orange-600 hover:bg-orange-700 shadow-md"
          >
            {loading ? 'Submitting...' : '✍️ Post Question'}
          </Button>
        </div>
      </form>
    </div>
  );
}
