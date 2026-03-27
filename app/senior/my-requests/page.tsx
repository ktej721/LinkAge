import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import RequestCard from '@/components/RequestCard';
import { getSignedAudioUrl, getSignedVideoUrl } from '@/lib/get-signed-url';

export const dynamic = 'force-dynamic';

export default async function MyRequestsPage({ searchParams }: { searchParams: { id?: string } }) {
  const user = await getSession();
  if (!user) return null;

  const { data: requests } = await supabaseAdmin
    .from('requests')
    .select(`
      *,
      responses(
        *,
        helper:users!responses_helper_id_fkey(name, college_name)
      )
    `)
    .eq('senior_id', user.id)
    .order('created_at', { ascending: false });

  const activeRequestId = searchParams.id;

  // Process signed URLs if an active request is viewed
  let activeRequestWithUrls = null;
  if (activeRequestId && requests) {
    const req = requests.find(r => r.id === activeRequestId);
    if (req) {
      activeRequestWithUrls = { ...req };
      if (req.audio_url) {
        activeRequestWithUrls.signed_audio = await getSignedAudioUrl(req.audio_url);
      }
      
      // Process responses
      if (req.responses) {
        activeRequestWithUrls.responses = await Promise.all(
          req.responses.map(async (resp: any) => {
            if (resp.video_url) {
              return { ...resp, signed_video: await getSignedVideoUrl(resp.video_url) };
            }
            return resp;
          })
        );
      }
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Questions</h1>
        <p className="text-xl text-gray-600 mt-2">Track the questions you've asked and view answers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* List side */}
        <div className={`space-y-4 ${activeRequestId ? 'hidden lg:block lg:col-span-5' : 'col-span-12 lg:col-span-7'}`}>
          {requests?.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-2xl border border-gray-200">
              <p className="text-xl text-gray-500">You haven't asked any questions yet.</p>
            </div>
          ) : (
            requests?.map(req => (
              <div key={req.id} className={req.id === activeRequestId ? 'ring-2 ring-orange-500 rounded-2xl' : ''}>
                <RequestCard request={req as any} viewAs="senior" />
              </div>
            ))
          )}
        </div>

        {/* Detail side */}
        {activeRequestId && activeRequestWithUrls && (
          <div className="col-span-12 lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-md">
              <a href="/senior/my-requests" className="lg:hidden text-indigo-600 font-medium mb-4 inline-block">← Back to list</a>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{activeRequestWithUrls.title}</h2>
              <p className="text-xl text-gray-700 whitespace-pre-wrap mb-6">{activeRequestWithUrls.description}</p>
              
              {activeRequestWithUrls.signed_audio && (
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-6">
                  <p className="font-semibold text-orange-800 mb-2">Your Voice Recording:</p>
                  <audio controls src={activeRequestWithUrls.signed_audio} className="w-full" />
                </div>
              )}

              <div className="mt-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Answers</h3>
                
                {(() => {
                  const approvedResponses = activeRequestWithUrls.responses?.filter((r: any) => r.is_approved) || [];
                  
                  if (approvedResponses.length === 0) {
                    return (
                      <div className="bg-blue-50 text-blue-800 p-6 rounded-2xl border border-blue-200 text-center">
                        <p className="text-lg font-medium">Your question is waiting for an answer or being reviewed.</p>
                        <p className="mt-2 text-blue-600">We'll notify you as soon as a student helper replies!</p>
                      </div>
                    );
                  }

                  return approvedResponses.map((resp: any, i: number) => (
                    <div key={resp.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xl">
                          {resp.helper?.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{resp.helper?.name || 'Student Helper'}</p>
                          <p className="text-indigo-600">{resp.helper?.college_name || 'Verified Student'}</p>
                        </div>
                      </div>

                      {resp.response_type === 'video' && resp.signed_video && (
                        <div className="mb-6 rounded-xl overflow-hidden bg-black">
                          <video controls src={resp.signed_video} className="w-full max-h-[400px]" />
                        </div>
                      )}

                      {resp.text_content && (
                        <div className="bg-white p-5 rounded-xl border border-gray-200">
                          <p className="text-gray-800 text-lg whitespace-pre-wrap">{resp.text_content}</p>
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
