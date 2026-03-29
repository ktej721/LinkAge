'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, Square, RotateCcw, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  /** Called with the audio blob when recording stops */
  onAudioBlob?: (blob: Blob) => void;
}

export default function VoiceRecorder({ onAudioBlob }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setAudioUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onAudioBlob?.(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast.error('Could not access microphone. Please grant permission.');
    }
  }, [onAudioBlob]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const reset = useCallback(() => {
    setAudioUrl(null);
    onAudioBlob?.(new Blob()); // trigger reset in parent if needed
  }, [onAudioBlob]);

  return (
    <div className={`flex flex-col gap-4 w-full`}>
      <div className="flex flex-col gap-3 w-full sm:flex-row sm:items-center">
        {!isRecording ? (
          <Button
            type="button"
            onClick={startRecording}
            className={`flex gap-2 items-center justify-center text-white rounded-2xl h-16 px-6 text-lg w-full sm:w-auto font-extrabold bg-amber-600 active:bg-amber-700`}
            size="lg"
          >
            <Mic className="w-6 h-6" />
            Tap to Record
          </Button>
        ) : (
          <Button
            type="button"
            onClick={stopRecording}
            className="flex gap-2 items-center justify-center bg-gray-700 active:bg-gray-800 text-white animate-pulse rounded-2xl h-16 px-6 text-lg w-full sm:w-auto font-extrabold"
            size="lg"
          >
            <Square className="w-6 h-6" />
            Stop Recording
          </Button>
        )}
        {audioUrl && (
          <Button type="button" variant="outline" onClick={reset} size="icon" className="h-16 w-16 rounded-2xl border-2">
            <RotateCcw className="w-6 h-6" />
          </Button>
        )}
      </div>

      {isRecording && (
        <div className="flex items-center gap-2 text-lg font-medium text-amber-600">
          <Mic className="w-5 h-5 animate-pulse" />
          <span>Recording... speak clearly</span>
        </div>
      )}

      {audioUrl && (
        <div className="p-5 border rounded-xl bg-amber-50 border-amber-200 space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wider text-amber-600 flex items-center gap-2">
            <Play className="w-4 h-4" />
            Your Audio Recording
          </p>
          <audio controls src={audioUrl} className="w-full h-12" />
        </div>
      )}
    </div>
  );
}
