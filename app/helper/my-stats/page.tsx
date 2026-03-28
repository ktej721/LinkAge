import { getSession } from '@/lib/auth';
import { TIER_CONFIG, MILESTONE_THRESHOLDS } from '@/lib/tiers';
import { HelperTier } from '@/types';
import Link from 'next/link';
import { Trophy, Flame, Target, Clock, Zap, Award, ChevronRight, TrendingUp, Star, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════
// DEMO DATA — hardcoded for hackathon presentation
// ═══════════════════════════════════════════════════════════
const DEMO_POINT_EVENTS = [
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
  milestone_5: '🎯 5 accepted solutions milestone!',
  milestone_10: '🎯 10 accepted solutions milestone!',
  milestone_25: '🎯 25 accepted solutions milestone!',
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

  // ═══════════════════════════════════════════════════
  // DEMO DATA — hardcoded for hackathon presentation
  // ═══════════════════════════════════════════════════
  const totalPoints = 1120;
  const tier: HelperTier = 'Champion';
  const tierConfig = TIER_CONFIG[tier];
  const currentStreak = 5;
  const longestStreak = 8;
  const accepted = 16;
  const totalResponses = 44;

  // Next tier calculation
  const currentTierIndex = Object.keys(TIER_CONFIG).indexOf(tier);
  const tierKeys = Object.keys(TIER_CONFIG);
  const nextTierKey = tierKeys[currentTierIndex + 1];
  const nextTierConfig = nextTierKey ? TIER_CONFIG[nextTierKey as keyof typeof TIER_CONFIG] : null;
  const progressToNextTier = nextTierConfig
    ? Math.min(100, Math.round(((totalPoints - tierConfig.minPoints) / (nextTierConfig.minPoints - tierConfig.minPoints)) * 100))
    : 100;

  // Points breakdown (demo)
  const breakdown: Record<string, number> = {
    accepted_by_senior: 500,
    response_submitted: 220,
    response_approved: 90,
    first_daily_response: 60,
    milestone_5: 100,
    milestone_10: 250,
  };

  // Next milestone
  const nextMilestone = MILESTONE_THRESHOLDS.find(m => accepted < m.count);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero — Tier Card */}
      <div
        className={`relative overflow-hidden rounded-3xl p-8 shadow-2xl bg-gradient-to-br ${tierConfig.bgGradient} border border-gray-100`}
        style={{ boxShadow: `0 20px 60px ${tierConfig.color}20` }}
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIxLjUiIGZpbGw9InJnYmEoMCwwLDAsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />

        {/* Floating emoji */}
        <div className="absolute top-4 right-6 text-7xl opacity-10 select-none">
          {tierConfig.emoji}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-gray-400" />
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Your Tier</p>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <span className="text-5xl">{tierConfig.emoji}</span>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">{tierConfig.label}</h1>
              <p className="text-gray-500 text-sm mt-0.5">{user.name} · {user.college_name || 'Student Helper'}</p>
            </div>
          </div>

          {/* Points + progress to next tier */}
          <div className="mt-6 bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-800">
                {totalPoints.toLocaleString()} points
              </span>
              {nextTierConfig && (
                <span className="text-xs font-medium text-gray-500">
                  {nextTierConfig.minPoints.toLocaleString()} needed for {nextTierKey}
                </span>
              )}
            </div>
            <div className="h-3 bg-gray-200/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressToNextTier}%`, backgroundColor: tierConfig.color }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
              <Zap className="w-4 h-4 text-teal-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">{totalPoints.toLocaleString()}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mt-1">Total Points</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Target className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">{accepted}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mt-1">Accepted</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">
            {currentStreak}
            {currentStreak > 3 && <span className="text-lg ml-1">🔥</span>}
          </p>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mt-1">Day Streak</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">{totalResponses}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mt-1">Responses</p>
        </div>
      </div>

      {/* Streak Card */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold text-gray-900">Streak</h2>
        </div>
        <div className="flex items-center gap-8">
          <div>
            <p className="text-5xl font-black text-gray-900">
              {currentStreak}
              {currentStreak > 3 && <span className="ml-2">🔥</span>}
            </p>
            <p className="text-sm text-gray-500 mt-1">Current Streak</p>
          </div>
          <div className="h-16 w-px bg-gray-200" />
          <div>
            <p className="text-3xl font-black text-gray-400">{longestStreak}</p>
            <p className="text-sm text-gray-500 mt-1">Longest Streak</p>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Award className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-bold text-gray-900">Milestones</h2>
        </div>
        <div className="space-y-4">
          {MILESTONE_THRESHOLDS.map(milestone => {
            const isAchieved = accepted >= milestone.count;
            const progress = Math.min(100, Math.round((accepted / milestone.count) * 100));

            return (
              <div key={milestone.reason} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${isAchieved ? '' : 'grayscale opacity-40'}`}>🏆</span>
                    <span className={`text-sm font-semibold ${isAchieved ? 'text-gray-900' : 'text-gray-500'}`}>
                      {milestone.count} Accepted Solutions
                    </span>
                    {isAchieved && (
                      <span className="text-[10px] uppercase tracking-wider bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                        Achieved!
                      </span>
                    )}
                  </div>
                  <span className={`text-sm font-bold ${isAchieved ? 'text-green-600' : 'text-gray-400'}`}>
                    +{milestone.bonus} pts
                  </span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      isAchieved
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                        : 'bg-gradient-to-r from-gray-300 to-gray-400'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  {Math.min(accepted, milestone.count)}/{milestone.count} accepted
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Point Breakdown */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Star className="w-5 h-5 text-teal-500" />
          <h2 className="text-lg font-bold text-gray-900">Points Breakdown</h2>
        </div>
        <div className="space-y-3">
          {Object.entries(breakdown).map(([reason, pts]) => (
            <div key={reason} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">
                {REASON_LABELS[reason] || reason.replace(/_/g, ' ')}
              </span>
              <span className="text-sm font-bold text-teal-600">+{pts}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {DEMO_POINT_EVENTS.slice(0, 20).map(event => (
            <div key={event.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-900 text-white font-bold text-sm">
                +{event.points}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  You earned <span className="font-bold text-teal-600">+{event.points}</span>{' '}
                  {REASON_LABELS[event.reason]
                    ? `for ${REASON_LABELS[event.reason].toLowerCase()}`
                    : `for ${event.reason.replace(/_/g, ' ')}`}
                </p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
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
          className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold text-sm transition-colors"
        >
          <Trophy className="w-4 h-4" />
          View Leaderboard
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
