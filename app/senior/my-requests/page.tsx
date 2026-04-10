import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import RequestCard from '@/components/RequestCard';
import AcceptSolutionButton from '@/components/AcceptSolutionButton';
import { getSignedAudioUrl, getSignedVideoUrl } from '@/lib/get-signed-url';
import { Clock, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function ExpiryBanner({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return null;
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  if (diffMs <= 0) return null;

  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const timeStr = diffH > 0 ? `${diffH}h ${diffM}m` : `${diffM} minutes`;

  const isUrgent = diffMs < 3 * 60 * 60 * 1000;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3.5 border-2 text-sm font-bold ${
        isUrgent
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-amber-50 border-amber-200 text-amber-700'
      }`}
    >
      {isUrgent ? (
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
      ) : (
        <Clock className="w-5 h-5 flex-shrink-0" />
      )}
      <span>Closes in <strong>{timeStr}</strong> — accept a solution before then.</span>
    </div>
  );
}

export default async function MyRequestsPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const user = await getSession();
  if (!user) return null;

  const requests = await prisma.request.findMany({
    where: { senior_id: user.id },
    include: {
      responses: {
        include: {
          helper: { select: { name: true, college_name: true } }
        }
      }
    },
    orderBy: { created_at: 'desc' },
  });

  const activeRequestId = searchParams.id;

  let activeRequestWithUrls: any = null;
  if (activeRequestId && requests) {
    const req = requests.find((r: any) => r.id === activeRequestId);
    if (req) {
      activeRequestWithUrls = { ...req };
      if (req.audio_url) {
        activeRequestWithUrls.signed_audio = await getSignedAudioUrl(req.audio_url);
      }

      if (req.responses) {
        activeRequestWithUrls.responses = await Promise.all(
          req.responses.map(async (resp: any) => {
            if (resp.video_url && resp.is_approved) {
              return { ...resp, signed_video: await getSignedVideoUrl(resp.video_url) };
            }
            return resp;
          })
        );
      }
    }
  }

  const visibleResponses: any[] =
    activeRequestWithUrls?.responses?.filter((r: any) => r.is_approved) || [];

  const isClosed = activeRequestWithUrls?.status === 'closed';
  const acceptedResponse = visibleResponses.find((r: any) => r.accepted_by_senior);

  // If viewing detail on mobile, show detail view only
  if (activeRequestId && activeRequestWithUrls) {
    return (
      <div className="space-y-5">
        {/* Back navigation */}
        <Link href="/senior/my-requests" className="inline-flex items-center gap-1.5 text-amber-600 font-bold text-sm active:text-amber-700 py-1">
          <ArrowLeft className="w-4 h-4" /> Back to all questions
        </Link>

        <div className="bg-white rounded-2xl p-5 border-2 border-slate-200 senior-card">
          <h2 className="text-xl font-extrabold text-slate-900 mb-3 leading-snug">
            {activeRequestWithUrls.title}
          </h2>
          <p className="text-base text-slate-600 whitespace-pre-wrap mb-5 leading-relaxed">
            {activeRequestWithUrls.description}
          </p>

          {activeRequestWithUrls.signed_audio && (
            <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200 mb-5">
              <p className="font-bold text-slate-700 mb-2 text-sm">Your Voice Recording</p>
              <audio controls src={activeRequestWithUrls.signed_audio} className="w-full" />
            </div>
          )}

          {activeRequestWithUrls.status === 'open' && (
            <div className="mb-5">
              <ExpiryBanner expiresAt={activeRequestWithUrls.expires_at} />
            </div>
          )}

          {isClosed && acceptedResponse && (
            <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-3.5 mb-5 text-amber-700 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              You&apos;ve marked this question as resolved.
            </div>
          )}

          {isClosed && !acceptedResponse && (
            <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 mb-5 text-slate-500 font-bold text-sm">
              <Clock className="w-5 h-5 flex-shrink-0" />
              This request closed after 24 hours.
            </div>
          )}
        </div>

        {/* Answers */}
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 mb-4">Answers</h3>

          {visibleResponses.length === 0 ? (
            <div className="bg-amber-50 text-amber-800 p-5 rounded-xl border-2 border-amber-100 text-center senior-card">
              <p className="text-base font-bold">
                Your question is waiting for an answer.
              </p>
              <p className="mt-1 text-amber-600 text-sm">
                We&apos;ll notify you as soon as a student helper replies.
              </p>
            </div>
          ) : (
            visibleResponses.map((resp: any) => (
              <div
                key={resp.id}
                className={`border-2 rounded-2xl p-5 mb-4 transition-all senior-card ${
                  resp.accepted_by_senior
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Helper info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-lg">
                    {resp.helper?.name?.charAt(0) || 'S'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-base truncate">
                      {resp.helper?.name || 'Student Helper'}
                    </p>
                    <p className="text-slate-500 text-sm truncate">
                      {resp.helper?.college_name || 'Verified Student'}
                    </p>
                  </div>
                  {resp.accepted_by_senior && (
                    <span className="flex items-center gap-1.5 text-amber-700 bg-amber-100 border border-amber-200 text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Accepted
                    </span>
                  )}
                </div>

                {/* Video */}
                {resp.response_type === 'video' && resp.signed_video && (
                  <div className="mb-4 rounded-xl overflow-hidden bg-black -mx-2">
                    <video
                      controls
                      src={resp.signed_video}
                      className="w-full max-h-[50vh]"
                    />
                  </div>
                )}

                {/* Text */}
                {resp.text_content && (
                  <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200 mb-4">
                    <p className="text-slate-800 text-base whitespace-pre-wrap leading-relaxed">
                      {resp.text_content}
                    </p>
                  </div>
                )}

                {/* Accept button — extra prominent for seniors */}
                {!isClosed && (
                  <div className="mt-4">
                    <AcceptSolutionButton
                      requestId={activeRequestWithUrls.id}
                      responseId={resp.id}
                      isAlreadyAccepted={resp.accepted_by_senior === true}
                      requestClosed={isClosed}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ======= List view (no selection) =======
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Your Questions</h1>
        <p className="text-base text-slate-500 mt-1">
          Tap a question to see answers from helpers.
        </p>
      </div>

      {requests?.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-2xl border-2 border-slate-200 senior-card">
          <p className="text-base text-slate-500">You haven&apos;t asked any questions yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests?.map((req: any) => (
            <div key={req.id}>
              <RequestCard request={req as any} viewAs="senior" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
