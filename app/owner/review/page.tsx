'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle, XCircle, User, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function ReviewPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/review');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      // The API now returns signed_video directly in each item
      setReviews(json.data || []);
    } catch (error: any) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response_id: id, action, rejection_reason: reason }),
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      
      toast.success(`Video ${action}d successfully`);
      setReviews(reviews.filter(r => r.id !== id));
      if (action === 'reject') {
        setRejectId(null);
        setRejectReason('');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
     return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-amber-600 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Video Review Queue</h1>
        <p className="text-gray-500 mt-1">Review helper submissions before they are sent to seniors.</p>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
          <div className="bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Queue is empty!</h3>
          <p className="text-gray-500 mt-2">All student videos have been reviewed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row">
              {/* Video Side */}
              <div className="md:w-5/12 bg-black flex items-center justify-center min-h-[250px]">
                {review.signed_video ? (
                   <video
                     controls
                     src={review.signed_video}
                     className="w-full h-full object-contain max-h-[400px]"
                     preload="metadata"
                     onError={(e) => {
                       console.error(`Video playback error for review ${review.id}:`, e);
                       // Mark this review's video as failed so UI can show retry
                       const target = e.currentTarget;
                       target.style.display = 'none';
                       const parent = target.parentElement;
                       if (parent && !parent.querySelector('.video-error-msg')) {
                         const errDiv = document.createElement('div');
                         errDiv.className = 'video-error-msg text-gray-400 p-10 flex flex-col items-center gap-3 text-center';
                         errDiv.innerHTML = `
                           <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                           <p>Video format not supported by browser.<br/>Try downloading or refreshing.</p>
                         `;
                         parent.appendChild(errDiv);
                       }
                     }}
                   />
                ) : (
                   <div className="text-gray-400 p-10 flex flex-col items-center gap-3">
                     <AlertTriangle className="w-10 h-10 text-yellow-500" />
                     <p className="text-center">Video could not be loaded.<br/>The signed URL may have expired.</p>
                     <Button variant="outline" size="sm" onClick={fetchReviews} className="text-white border-gray-600 hover:bg-gray-800">
                       Refresh & Retry
                     </Button>
                   </div>
                )}
              </div>
              
              {/* Content Side */}
              <div className="p-6 md:p-8 md:w-7/12 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-2">Original Request</h3>
                      <p className="font-semibold text-gray-800">{review.request?.title}</p>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">{review.request?.description}</p>
                      <p className="text-xs text-gray-500 mt-2">Asked by {review.request?.senior?.name}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                       <User className="w-5 h-5 text-amber-600" />
                       <div>
                         <p className="font-medium text-gray-900">{review.helper?.name}</p>
                         <p className="text-xs text-amber-600">{review.helper?.college_name} ({review.helper?.email})</p>
                       </div>
                    </div>
                    {review.text_content && (
                      <p className="text-sm text-gray-700 mt-3 pt-3 border-t border-slate-200">
                        <span className="font-semibold block mb-1">Text Summary:</span>
                        {review.text_content}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                  <Button 
                    onClick={() => handleAction(review.id, 'approve')}
                    disabled={actionLoading === review.id}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white gap-2 h-12"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {actionLoading === review.id ? 'Approving...' : 'Approve & Publish'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setRejectId(review.id)}
                    disabled={actionLoading === review.id}
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50 gap-2 h-12"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!rejectId} onOpenChange={(open) => !open && setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Video</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason for rejection</label>
            <Textarea 
              value={rejectReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
              placeholder="e.g., Video is too blurry, Audio is not clear..."
              className="resize-none"
              rows={4}
            />
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setRejectId(null)}>Cancel</Button>
             <Button 
               variant="destructive" 
               disabled={!rejectReason.trim()}
               onClick={() => rejectId && handleAction(rejectId, 'reject', rejectReason)}
             >
               Confirm Rejection
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
