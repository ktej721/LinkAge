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
  const [videoSource, setVideoSource] = useState<'none' | 'recorded' | 'uploaded'>('none');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopRecordingCallback = useCallback(() => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  }, []);

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
        setVideoSource('recorded');
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
            stopRecordingCallback();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      toast.error('Camera access denied. Please enable camera permissions.');
    }
  }, [maxDurationSeconds, onVideoBlob, stopRecordingCallback]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/ogg', 'video/mpeg'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|webm|mov|avi|mkv|ogg|mpeg)$/i)) {
      toast.error('Invalid file type. Please upload a video file (MP4, WebM, MOV, AVI, MKV).');
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 100MB.');
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setVideoSource('uploaded');
    setUploadedFileName(file.name);

    // Create a blob from the file and pass it up
    // The file itself IS a Blob, so we can pass it directly  
    onVideoBlob(file);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
    }

    toast.success(`Video "${file.name}" loaded successfully!`);
  }, [onVideoBlob]);

  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const reset = useCallback(() => {
    setVideoUrl(null);
    setVideoSource('none');
    setUploadedFileName('');
    setTimeLeft(maxDurationSeconds);
    onVideoBlob(new Blob());
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = '';
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [maxDurationSeconds, onVideoBlob]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Hidden file input for video upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,video/ogg,video/mpeg,.mp4,.webm,.mov,.avi,.mkv"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="relative bg-black rounded-xl overflow-hidden aspect-video w-full max-w-md mx-auto">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted={isRecording}
          playsInline
          controls={!!videoUrl && !isRecording}
        />
        {!isRecording && !videoUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Video className="w-16 h-16 text-gray-500" />
            <p className="text-gray-400 text-sm text-center px-4">
              Record a video or upload one from your device
            </p>
          </div>
        )}
        {isRecording && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-sm px-3 py-1.5 rounded-full flex items-center gap-2 font-medium">
            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        )}
        {videoSource === 'uploaded' && videoUrl && (
          <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Upload className="w-3 h-3" />
            {uploadedFileName.length > 25 ? uploadedFileName.slice(0, 22) + '...' : uploadedFileName}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {!isRecording && !videoUrl && (
          <>
            <Button
              type="button"
              onClick={startRecording}
              className="bg-red-500 hover:bg-red-600 text-white gap-2 font-semibold"
            >
              <Video className="w-4 h-4" /> Record Video
            </Button>
            <Button
              type="button"
              onClick={triggerFileUpload}
              variant="outline"
              className="gap-2 font-semibold border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Upload className="w-4 h-4" /> Upload Video File
            </Button>
          </>
        )}
        {isRecording && (
          <Button
            type="button"
            onClick={stopRecordingCallback}
            className="bg-gray-700 hover:bg-gray-800 text-white gap-2 font-semibold"
          >
            <Square className="w-4 h-4" /> Stop
          </Button>
        )}
        {videoUrl && (
          <Button
            type="button"
            variant="outline"
            onClick={reset}
            className="gap-2 font-semibold"
          >
            <RotateCcw className="w-4 h-4" /> {videoSource === 'uploaded' ? 'Change Video' : 'Re-record'}
          </Button>
        )}
      </div>
    </div>
  );
}
