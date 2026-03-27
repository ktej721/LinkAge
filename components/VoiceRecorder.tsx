'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Square, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  onAudioBlob?: (blob: Blob) => void;
  language?: string;
}

const LANGUAGE_CODES: Record<string, string> = {
  english: 'en-IN',
  hindi: 'hi-IN',
  tamil: 'ta-IN',
  telugu: 'te-IN',
  kannada: 'kn-IN',
  malayalam: 'ml-IN',
  marathi: 'mr-IN',
  bengali: 'bn-IN',
};

export default function VoiceRecorder({ onTranscript, onAudioBlob, language = 'english' }: VoiceRecorderProps) {
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setTranscript('');
    setAudioBlob(null);

    // Start audio capture
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        onAudioBlob?.(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast.error('Could not access microphone. Please grant permission.');
    }

    // Start speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported. Please type your question.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = LANGUAGE_CODES[language] || 'en-IN';
    recognitionRef.current = recognition;

    let finalTranscript = '';
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const full = (finalTranscript + interim).trim();
      setTranscript(full);
      onTranscript(full);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        toast.error('Speech recognition error: ' + event.error);
      }
    };

    recognition.start();
    setIsListening(true);
  }, [language, onTranscript, onAudioBlob]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    setIsListening(false);
    setIsRecording(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setAudioBlob(null);
    onTranscript('');
  }, [onTranscript]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex gap-3 items-center">
        {!isListening ? (
          <Button
            type="button"
            onClick={startRecording}
            className="flex gap-2 items-center bg-red-500 hover:bg-red-600 text-white rounded-2xl py-6 px-6 text-lg"
            size="lg"
          >
            <Mic className="w-6 h-6" />
            Tap to Speak
          </Button>
        ) : (
          <Button
            type="button"
            onClick={stopRecording}
            className="flex gap-2 items-center bg-gray-700 hover:bg-gray-800 text-white animate-pulse rounded-2xl py-6 px-6 text-lg"
            size="lg"
          >
            <Square className="w-6 h-6" />
            Stop Recording
          </Button>
        )}
        {transcript && (
          <Button type="button" variant="outline" onClick={reset} size="icon" className="h-14 w-14 rounded-2xl">
            <RotateCcw className="w-6 h-6" />
          </Button>
        )}
      </div>

      {isListening && (
        <div className="flex items-center gap-2 text-red-500 text-lg font-medium">
          <MicOff className="w-5 h-5 animate-pulse" />
          <span>Listening... please speak clearly</span>
        </div>
      )}

      {transcript && (
        <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-xl">
          <p className="text-sm text-indigo-600 font-semibold mb-2 uppercase tracking-wider">Recognized text:</p>
          <p className="text-gray-900 text-xl font-medium leading-relaxed">{transcript}</p>
        </div>
      )}
    </div>
  );
}
