'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(isAlreadyAccepted);
  const [error, setError] = useState<string | null>(null);

  if (accepted) {
    return (
      <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 font-semibold text-sm">
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        You accepted this solution
      </div>
    );
  }

  if (requestClosed && !accepted) {
    return null;
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
        router.refresh();
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
        className="w-full bg-amber-600 active:bg-amber-700 text-white font-extrabold rounded-2xl h-16 text-lg gap-2 shadow-md active:shadow-sm transition-all senior-btn"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Accepting…
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            Accept this Solution
          </>
        )}
      </Button>
      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
    </div>
  );
}
