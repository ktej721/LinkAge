'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Square, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  /** Called with the final transcript when recording stops */
  onTranscript: (text: string) => void;
  /** Called with the audio blob when recording stops */
  onAudioBlob?: (blob: Blob) => void;
  language?: string;
  /** 'full' = standalone recorder with audio capture; 'dictation' = voice-typing helper (no audio blob) */
  mode?: 'full' | 'dictation';
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

export default function VoiceRecorder({ onTranscript, onAudioBlob, language = 'english', mode = 'full' }: VoiceRecorderProps) {
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  // Stores all finalized text segments, indexed by their result position
  const finalSegmentsRef = useRef<string[]>([]);
  // Keeps a reference to the latest onTranscript callback to avoid stale closures
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const startRecording = useCallback(async () => {
    setTranscript('');
    setAudioBlob(null);
    finalSegmentsRef.current = [];

    // Start audio capture only in 'full' mode
    if (mode === 'full') {
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
        return;
      }
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

    recognition.onresult = (event: any) => {
      // Build the complete transcript from all results
      // Each result at index i is processed once — isFinal results are stored in the segments array
      let interimPart = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          // Store this finalized segment (overwrite in case it was interim before)
          finalSegmentsRef.current[i] = event.results[i][0].transcript.trim();
        } else {
          interimPart += event.results[i][0].transcript;
        }
      }
      
      // Combine all finalized segments + current interim
      const allFinal = finalSegmentsRef.current.filter(Boolean).join(' ');
      const currentText = interimPart ? `${allFinal} ${interimPart}`.trim() : allFinal;
      setTranscript(currentText);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        toast.error('Speech recognition error: ' + event.error);
      }
    };

    recognition.onend = () => {
      // When recognition ends, deliver the final transcript
      const finalText = finalSegmentsRef.current.filter(Boolean).join(' ').trim();
      if (finalText) {
        onTranscriptRef.current(finalText);
      }
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  }, [language, onAudioBlob, mode]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    if (mode === 'full') {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
    // isListening is set to false in recognition.onend
  }, [mode]);

  const reset = useCallback(() => {
    setTranscript('');
    setAudioBlob(null);
    finalSegmentsRef.current = [];
  }, []);

  const isDictation = mode === 'dictation';

  return (
    <div className={`flex flex-col gap-4 w-full`}>
      <div className="flex gap-3 items-center">
        {!isListening ? (
          <Button
            type="button"
            onClick={startRecording}
            className={`flex gap-2 items-center text-white rounded-2xl py-6 px-6 text-lg ${isDictation ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-red-500 hover:bg-red-600'}`}
            size="lg"
          >
            <Mic className="w-6 h-6" />
            {isDictation ? 'Voice Type' : 'Tap to Speak'}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={stopRecording}
            className="flex gap-2 items-center bg-gray-700 hover:bg-gray-800 text-white animate-pulse rounded-2xl py-6 px-6 text-lg"
            size="lg"
          >
            <Square className="w-6 h-6" />
            Stop {isDictation ? 'Typing' : 'Recording'}
          </Button>
        )}
        {transcript && (
          <Button type="button" variant="outline" onClick={reset} size="icon" className="h-14 w-14 rounded-2xl">
            <RotateCcw className="w-6 h-6" />
          </Button>
        )}
      </div>

      {isListening && (
        <div className={`flex items-center gap-2 text-lg font-medium ${isDictation ? 'text-indigo-500' : 'text-red-500'}`}>
          <MicOff className="w-5 h-5 animate-pulse" />
          <span>{isDictation ? 'Listening... speak to type' : 'Listening... please speak clearly'}</span>
        </div>
      )}

      {transcript && (
        <div className={`p-5 border rounded-xl ${isDictation ? 'bg-emerald-50 border-emerald-200' : 'bg-indigo-50 border-indigo-200'}`}>
          <p className={`text-sm font-semibold mb-2 uppercase tracking-wider ${isDictation ? 'text-emerald-600' : 'text-indigo-600'}`}>
            {isDictation ? 'Voice-typed text:' : 'Recognized text:'}
          </p>
          <p className="text-gray-900 text-xl font-medium leading-relaxed">{transcript}</p>
        </div>
      )}
    </div>
  );
}
