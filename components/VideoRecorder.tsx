'use client';

import { useState, useRef, useCallback } from 'react';
import { Video, Square, RotateCcw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface VideoRecorderProps {
  onVideoBlob: (blob: Blob) => void;
  maxDurationSeconds?: number;
}

export default function VideoRecorder({ onVideoBlob, maxDurationSeconds = 120 }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(maxDurationSeconds);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        onVideoBlob(blob);
        stream.getTracks().forEach(t => t.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = url;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTimeLeft(maxDurationSeconds);

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      toast.error('Camera access denied. Please enable camera permissions.');
    }
  }, [maxDurationSeconds, onVideoBlob, stopRecording]); // stopRecording added to dependencies

  const stopRecordingCallback = useCallback(() => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  }, []);

  const reset = useCallback(() => {
    setVideoUrl(null);
    setTimeLeft(maxDurationSeconds);
    onVideoBlob(new Blob());
  }, [maxDurationSeconds, onVideoBlob]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative bg-black rounded-xl overflow-hidden aspect-video max-w-md">
        <video ref={videoRef} className="w-full h-full object-cover" muted={isRecording} playsInline controls={!!videoUrl && !isRecording} />
        {!isRecording && !videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Video className="w-16 h-16 text-gray-500" />
          </div>
        )}
        {isRecording && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-sm px-3 py-1.5 rounded-full flex items-center gap-2 font-medium">
            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {!isRecording && !videoUrl && (
          <Button type="button" onClick={startRecording} className="bg-red-500 hover:bg-red-600 text-white gap-2 font-semibold">
            <Video className="w-4 h-4" /> Start Recording
          </Button>
        )}
        {isRecording && (
          <Button type="button" onClick={stopRecordingCallback} className="bg-gray-700 hover:bg-gray-800 text-white gap-2 font-semibold">
            <Square className="w-4 h-4" /> Stop
          </Button>
        )}
        {videoUrl && (
          <Button type="button" variant="outline" onClick={reset} className="gap-2 font-semibold">
            <RotateCcw className="w-4 h-4" /> Re-record
          </Button>
        )}
      </div>
    </div>
  );
}
