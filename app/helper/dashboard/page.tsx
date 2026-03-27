import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Search, Settings, ShieldAlert, ShieldCheck, Video, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HelperDashboard() {
  const user = await getSession();
  if (!user) return null;

  // Fetch helper's responses
  const { data: responses } = await supabaseAdmin
    .from('responses')
    .select(`
      *,
      request:requests(title)
    `)
    .eq('helper_id', user.id)
    .order('created_at', { ascending: false });

  const total = responses?.length || 0;
  const approved = responses?.filter(r => r.is_approved).length || 0;
  const pending = responses?.filter(r => !r.is_approved && !r.is_rejected).length || 0;
  const rejected = responses?.filter(r => r.is_rejected).length || 0;

  return (
    <div className="space-y-8">
      {/* Welcome & KYC Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}!</h1>
          <p className="text-gray-500 mt-1">{user.college_name || 'Student Helper'}</p>
        </div>
        <div className="flex items-center gap-2">
          {user.is_kyc_verified ? (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1.5 text-sm flex gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Verified Student
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 px-3 py-1.5 text-sm flex gap-1.5">
              <ShieldAlert className="w-4 h-4" /> Unverified
            </Badge>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className={`p-5 rounded-2xl border ${user.is_kyc_verified ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'}`}>
        <h3 className={`font-semibold mb-2 ${user.is_kyc_verified ? 'text-emerald-800' : 'text-blue-800'}`}>
          {user.is_kyc_verified ? 'You have full access 🚀' : 'How it works for new helpers'}
        </h3>
        <p className={user.is_kyc_verified ? 'text-emerald-700' : 'text-blue-700'}>
          {user.is_kyc_verified 
            ? 'As a verified student, you can submit both video and written responses that go live immediately to help seniors.' 
            : 'You can browse questions and submit video responses. Our moderation team will review your videos before they are shown to seniors. Complete your profile verification to unlock instant text responses.'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Total Answers</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-sm text-green-600 font-medium">Approved</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{approved}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-sm text-yellow-600 font-medium">Pending Review</p>
          <p className="text-3xl font-bold text-yellow-700 mt-1">{pending}</p>
        </div>
         <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-sm text-red-600 font-medium">Rejected</p>
          <p className="text-3xl font-bold text-red-700 mt-1">{rejected}</p>
        </div>
      </div>

      {/* Main Action */}
      <div className="flex justify-center">
        <Link href="/helper/browse" className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto text-lg py-6 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-md">
            <Search className="w-5 h-5" /> Browse Open Requests
          </Button>
        </Link>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Recent Activity</h2>
        
        {total === 0 ? (
          <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-gray-300">
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">No answers yet</p>
            <p className="text-gray-500">Go browse open requests and start helping out!</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {responses?.slice(0, 5).map(resp => (
                <div key={resp.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <h4 className="font-semibold text-gray-900 line-clamp-1">{resp.request?.title || 'Unknown Request'}</h4>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <span>{new Date(resp.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="capitalize">{resp.response_type} Response</span>
                    </p>
                  </div>
                  
                  <div>
                    {resp.is_approved ? (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                        <CheckCircle2 className="w-4 h-4" /> Approved
                      </span>
                    ) : resp.is_rejected ? (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                        <Settings className="w-4 h-4" /> Needs Revision
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-yellow-700 bg-yellow-50 px-2.5 py-1 rounded-full border border-yellow-200">
                        <Clock className="w-4 h-4" /> In Review
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {total > 5 && (
              <div className="p-4 bg-gray-50 text-center border-t border-gray-200">
                <span className="text-sm text-gray-500">Showing 5 of {total} answers</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
