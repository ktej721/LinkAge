'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CloseCallPage() {
  const params = useParams();
  const requestId = params.requestId as string;
  const router = useRouter();

  useEffect(() => {
    if (!requestId) return;
    
    const markClosed = async () => {
      try {
        await fetch(`/api/requests/${requestId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'closed' }),
        });
        toast.success('Task resolved successfully!');
      } catch (e) {
        console.error(e);
      } finally {
        router.push('/helper/dashboard');
      }
    };
    markClosed();
  }, [requestId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-slate-800 p-8">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto" />
        <h2 className="text-2xl font-bold">Wrapping up call...</h2>
        <p className="text-slate-500">Closing the request and returning to your dashboard.</p>
      </div>
    </div>
  );
}
