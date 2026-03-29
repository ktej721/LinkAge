'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Share, PlusSquare } from 'lucide-react';

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Check if app is already installed/running in standalone
    const isRunningStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    setIsStandalone(isRunningStandalone);

    // If running standalone, don't show any installation prompts
    if (isRunningStandalone) return;

    // Handle Android/Chrome default install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent Chrome 67+ from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Wait a moment then show our custom UI
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Force show the prompt after 3 seconds for demonstration purposes
    // (In production, Chrome can be flaky about firing beforeinstallprompt depending on heuristics)
    if (!isRunningStandalone) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the native install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      // Clear the saved prompt since it can't be used again
      setDeferredPrompt(null);
    } else {
      // Fallback for browsers (like desktop Safari or iOS Chrome) that don't support the programmatic prompt
      alert("To install LinkAge, please open your browser menu and select 'Add to Home Screen' or 'Install App'.");
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-[100] max-w-sm mx-auto sm:mx-0 animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 relative overflow-hidden">
        <div className="absolute top-2 right-2">
          <button onClick={handleDismiss} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex gap-4 items-start pr-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex-shrink-0 flex items-center justify-center shadow-inner relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600"></div>
             <span className="text-white font-bold text-xl relative z-10">L</span>
          </div>
          
          <div className="space-y-1 mt-0.5">
            <h4 className="font-bold text-slate-900 text-base">Install LinkAge</h4>
            
            {isIOS ? (
              <p className="text-sm text-slate-500 leading-snug">
                Install this app on your iPhone: tap <Share className="w-4 h-4 inline text-blue-500 mx-0.5" /> and then <PlusSquare className="w-4 h-4 inline border border-slate-400 rounded-sm p-0.5 text-slate-600 mx-0.5" /> <strong className="font-semibold text-slate-700">Add to Home Screen</strong>.
              </p>
            ) : (
              <div className="space-y-3 pt-1">
                <p className="text-sm text-slate-500 leading-snug">
                  Add to your home screen for quick, offline access.
                </p>
                <Button 
                  onClick={handleInstallClick}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl h-10 shadow-md transition-transform active:scale-95"
                >
                  Add to Home Screen
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
