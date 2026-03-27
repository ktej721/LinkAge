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

export default function NewRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: 'english',
    category: 'general',
  });
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const handleTranscript = (text: string) => {
    setFormData(prev => ({
      ...prev,
      description: prev.description ? `${prev.description} ${text}` : text,
      // Auto-generate title from first few words if empty
      title: prev.title || (text.split(' ').slice(0, 5).join(' ') + (text.split(' ').length > 5 ? '...' : '')),
    }));
  };

  const uploadAudio = async (blob: Blob): Promise<string | null> => {
    try {
      const { path, url } = await fetch('/api/audio/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: 'recording.webm' }),
      }).then(res => res.json());

      if (!url) throw new Error('Failed to get upload URL');

      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': 'audio/webm' },
      });

      if (!uploadRes.ok) throw new Error('Upload failed');
      return path;
    } catch (error) {
      console.error('Audio upload error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Please provide a title and description.');
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
        body: JSON.stringify({ ...formData, audio_url }),
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

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">What do you need help with?</h1>
        <p className="text-xl text-gray-600">Tap the mic to speak, or type your question below.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200">
        <label className="block text-xl font-semibold text-gray-900 mb-4">
          Record your question (Optional)
        </label>
        <VoiceRecorder 
          onTranscript={handleTranscript} 
          onAudioBlob={setAudioBlob} 
          language={formData.language} 
        />
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-6">
        <div className="space-y-3">
          <Label htmlFor="title" className="text-xl font-semibold">Short Summary (Title)</Label>
          <Input 
            id="title" 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})}
            placeholder="e.g. How to pay electricity bill online?" 
            className="text-xl py-8 rounded-xl"
            required
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="description" className="text-xl font-semibold">Detailed Question</Label>
          <Textarea 
            id="description" 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})}
            placeholder="Please explain what you need help with..." 
            className="text-xl p-4 min-h-[150px] rounded-xl"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
          <div className="space-y-3">
            <Label htmlFor="category" className="text-xl font-semibold">Category</Label>
            <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
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
            <Label htmlFor="language" className="text-xl font-semibold">Language</Label>
            <Select value={formData.language} onValueChange={(val) => setFormData({...formData, language: val})}>
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
            {loading ? 'Submitting...' : 'Post Question'}
          </Button>
        </div>
      </form>
    </div>
  );
}
