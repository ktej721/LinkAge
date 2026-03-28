import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import RequestCard from '@/components/RequestCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';

// Force dynamic since it relies on cookies/session
export const dynamic = 'force-dynamic';

export default async function SeniorDashboard() {
  const user = await getSession();
  if (!user) return null;

  // Get current hour for greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Fetch recent requests
  const { data: requests } = await supabaseAdmin
    .from('requests')
    .select('*, responses(id, is_approved)')
    .eq('senior_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const total = requests?.length || 0;
  const answered = requests?.filter(r => r.status === 'answered' || r.status === 'closed').length || 0;
  const open = requests?.filter(r => r.status === 'open').length || 0;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-3xl p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{greeting}, {user.name.split(' ')[0]}! 👋</h1>
        <p className="text-xl text-gray-700">How can our student helpers assist you today?</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-base font-medium uppercase tracking-wider">Total Questions</p>
            <p className="text-4xl font-bold text-gray-900 mt-1">{total}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-green-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-green-600 text-base font-medium uppercase tracking-wider">Answered</p>
            <p className="text-4xl font-bold text-green-700 mt-1">{answered}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-blue-600 text-base font-medium uppercase tracking-wider">Pending Help</p>
            <p className="text-4xl font-bold text-blue-700 mt-1">{open}</p>
          </div>
        </div>
      </div>

      {/* Main CTA */}
      <div className="flex justify-center py-4">
        <Link href="/senior/new-request" className="block w-full max-w-lg">
          <Button size="lg" className="w-full text-xl py-8 rounded-3xl bg-orange-600 hover:bg-orange-700 shadow-lg hover:shadow-xl transition-all gap-3">
            <Mic className="w-8 h-8" /> 
            Ask a New Question
          </Button>
        </Link>
      </div>

      {/* Recent Requests */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Recent Questions</h2>
          {total > 0 && (
            <Link href="/senior/my-requests" className="text-indigo-600 font-medium hover:underline text-lg">
              View All →
            </Link>
          )}
        </div>

        {total === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="bg-orange-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mic className="w-12 h-12 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">You haven&apos;t asked anything yet!</h3>
            <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto">
              Tap the big button above and just speak your question. Our student volunteers are ready to help.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requests?.map(req => (
              <RequestCard key={req.id} request={req as any} viewAs="senior" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
