import { getSession } from '@/lib/auth';
import { TIER_CONFIG, MILESTONE_THRESHOLDS } from '@/lib/tiers';
import { HelperTier } from '@/types';
import Link from 'next/link';
import { Trophy, Flame, Target, Clock, Zap, Award, ChevronRight, TrendingUp, Star } from 'lucide-react';

export const dynamic = 'force-dynamic';

const POINT_EVENTS = [
  { id: 'evt-1', points: 50, reason: 'accepted_by_senior', created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString() },
  { id: 'evt-2', points: 5, reason: 'response_submitted', created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: 'evt-3', points: 15, reason: 'response_approved', created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 'evt-4', points: 50, reason: 'accepted_by_senior', created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { id: 'evt-5', points: 10, reason: 'first_daily_response', created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { id: 'evt-6', points: 5, reason: 'response_submitted', created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() },
  { id: 'evt-7', points: 50, reason: 'accepted_by_senior', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: 'evt-8', points: 15, reason: 'response_approved', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.5).toISOString() },
  { id: 'evt-9', points: 250, reason: 'milestone_10', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
  { id: 'evt-10', points: 50, reason: 'accepted_by_senior', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
  { id: 'evt-11', points: 10, reason: 'first_daily_response', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
  { id: 'evt-12', points: 5, reason: 'response_submitted', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() },
  { id: 'evt-13', points: 100, reason: 'milestone_5', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
  { id: 'evt-14', points: 50, reason: 'accepted_by_senior', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
  { id: 'evt-15', points: 5, reason: 'response_submitted', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString() },
  { id: 'evt-16', points: 50, reason: 'accepted_by_senior', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString() },
  { id: 'evt-17', points: 15, reason: 'response_approved', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString() },
  { id: 'evt-18', points: 5, reason: 'response_submitted', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString() },
  { id: 'evt-19', points: 50, reason: 'accepted_by_senior', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() },
  { id: 'evt-20', points: 10, reason: 'first_daily_response', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() },
];

const REASON_LABELS: Record<string, string> = {
  response_submitted: 'Response submitted',
  accepted_by_senior: 'Solution accepted by senior',
  response_approved: 'Response approved by admin',
  first_daily_response: 'First response of the day (streak bonus)',
  milestone_5: '5 accepted solutions milestone',
  milestone_10: '10 accepted solutions milestone',
  milestone_25: '25 accepted solutions milestone',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default async function MyStatsPage() {
  const user = await getSession();
  if (!user) return null;

  const totalPoints = 1120;
  const tier: HelperTier = 'Champion';
  const tierConfig = TIER_CONFIG[tier];
  const currentStreak = 5;
  const longestStreak = 8;
  const accepted = 16;
  const totalResponses = 44;

  const currentTierIndex = Object.keys(TIER_CONFIG).indexOf(tier);
  const tierKeys = Object.keys(TIER_CONFIG);
  const nextTierKey = tierKeys[currentTierIndex + 1];
  const nextTierConfig = nextTierKey ? TIER_CONFIG[nextTierKey as keyof typeof TIER_CONFIG] : null;
  const progressToNextTier = nextTierConfig
    ? Math.min(100, Math.round(((totalPoints - tierConfig.minPoints) / (nextTierConfig.minPoints - tierConfig.minPoints)) * 100))
    : 100;

  const breakdown: Record<string, number> = {
    accepted_by_senior: 500,
    response_submitted: 220,
    response_approved: 90,
    first_daily_response: 60,
    milestone_5: 100,
    milestone_10: 250,
  };

  const nextMilestone = MILESTONE_THRESHOLDS.find(m => accepted < m.count);

  return (
    <div className="space-y-6 pb-12">
      {/* Tier Card */}
      <div
        className={`relative overflow-hidden rounded-2xl p-8 shadow-md bg-gradient-to-br ${tierConfig.bgGradient} border border-slate-200`}
      >
        <div className="absolute top-4 right-6 text-6xl opacity-5 select-none">
          {tierConfig.emoji}
        </div>

        <div className="relative z-10">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Your Tier</p>

          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{tierConfig.emoji}</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{tierConfig.label}</h1>
              <p className="text-slate-500 text-sm mt-0.5">{user.name} · {user.college_name || 'Student Helper'}</p>
            </div>
          </div>

          <div className="mt-5 bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-800">
                {totalPoints.toLocaleString()} points
              </span>
              {nextTierConfig && (
                <span className="text-xs font-medium text-slate-400">
                  {nextTierConfig.minPoints.toLocaleString()} needed for {nextTierKey}
                </span>
              )}
            </div>
            <div className="h-2.5 bg-slate-200/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out bg-amber-500"
                style={{ width: `${progressToNextTier}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{totalPoints.toLocaleString()}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mt-1">Total Points</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <Target className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{accepted}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mt-1">Accepted</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <Flame className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{currentStreak}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mt-1">Day Streak</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{totalResponses}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mt-1">Responses</p>
        </div>
      </div>

      {/* Streak Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-slate-900">Streak</h2>
        </div>
        <div className="flex items-center gap-8">
          <div>
            <p className="text-4xl font-black text-slate-900">{currentStreak}</p>
            <p className="text-sm text-slate-400 mt-1">Current Streak</p>
          </div>
          <div className="h-12 w-px bg-slate-200" />
          <div>
            <p className="text-2xl font-black text-slate-300">{longestStreak}</p>
            <p className="text-sm text-slate-400 mt-1">Longest Streak</p>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Award className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-slate-900">Milestones</h2>
        </div>
        <div className="space-y-4">
          {MILESTONE_THRESHOLDS.map(milestone => {
            const isAchieved = accepted >= milestone.count;
            const progress = Math.min(100, Math.round((accepted / milestone.count) * 100));

            return (
              <div key={milestone.reason} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-base ${isAchieved ? '' : 'grayscale opacity-40'}`}>
                      <Trophy className="w-4 h-4 inline" />
                    </span>
                    <span className={`text-sm font-semibold ${isAchieved ? 'text-slate-900' : 'text-slate-400'}`}>
                      {milestone.count} Accepted Solutions
                    </span>
                    {isAchieved && (
                      <span className="text-[10px] uppercase tracking-wider bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                        Achieved
                      </span>
                    )}
                  </div>
                  <span className={`text-sm font-bold ${isAchieved ? 'text-amber-600' : 'text-slate-300'}`}>
                    +{milestone.bonus} pts
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      isAchieved
                        ? 'bg-amber-500'
                        : 'bg-slate-300'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {Math.min(accepted, milestone.count)}/{milestone.count} accepted
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Point Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Star className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-slate-900">Points Breakdown</h2>
        </div>
        <div className="space-y-3">
          {Object.entries(breakdown).map(([reason, pts]) => (
            <div key={reason} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <span className="text-sm text-slate-600">
                {REASON_LABELS[reason] || reason.replace(/_/g, ' ')}
              </span>
              <span className="text-sm font-bold text-amber-600">+{pts}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" />
          <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {POINT_EVENTS.slice(0, 15).map(event => (
            <div key={event.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-900 text-white font-bold text-xs">
                +{event.points}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">
                  <span className="font-bold text-amber-600">+{event.points}</span>{' '}
                  {REASON_LABELS[event.reason]
                    ? `for ${REASON_LABELS[event.reason].toLowerCase()}`
                    : `for ${event.reason.replace(/_/g, ' ')}`}
                </p>
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0">
                {timeAgo(event.created_at)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Link to leaderboard */}
      <div className="text-center">
        <Link
          href="/helper/leaderboard"
          className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold text-sm transition-colors"
        >
          <Trophy className="w-4 h-4" />
          View Leaderboard
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
