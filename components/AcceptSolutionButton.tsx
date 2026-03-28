'use client';

import { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AcceptSolutionButtonProps {
  requestId: string;
  responseId: string;
  isAlreadyAccepted: boolean;
  requestClosed: boolean;
}

export default function AcceptSolutionButton({
  requestId,
  responseId,
  isAlreadyAccepted,
  requestClosed,
}: AcceptSolutionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(isAlreadyAccepted);
  const [error, setError] = useState<string | null>(null);

  if (accepted) {
    return (
      <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 font-semibold text-sm">
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        ✅ You accepted this solution
      </div>
    );
  }

  if (requestClosed && !accepted) {
    return null; // Another solution was accepted; hide button on other cards
  }

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/requests/${requestId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response_id: responseId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Something went wrong.');
      } else {
        setAccepted(true);
        // Reload the page to reflect the closed status across the UI
        window.location.reload();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1">
      <Button
        onClick={handleAccept}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl py-5 text-base gap-2 shadow-sm hover:shadow-md transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Accepting…
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            ✅ Accept this Solution
          </>
        )}
      </Button>
      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
    </div>
  );
}
