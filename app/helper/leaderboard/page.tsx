import { getSession } from '@/lib/auth';
import { getTierFromPoints, TIER_CONFIG } from '@/lib/tiers';
import { HelperLeaderboardEntry, HelperTier } from '@/types';
import Link from 'next/link';
import { Trophy, Flame, ChevronRight, TrendingUp, School } from 'lucide-react';

export const dynamic = 'force-dynamic';

const PLATFORM_HELPERS: HelperLeaderboardEntry[] = [
  {
    rank: 1, helper_id: 'h-1', name: 'Arjun Mehta',
    college_name: 'IIT Bombay', college_domain: 'iitb.ac.in',
    total_points: 2340, accepted_count: 32, response_count: 78,
    tier: 'Legend', streak: 14,
  },
  {
    rank: 2, helper_id: 'h-2', name: 'Priya Sharma',
    college_name: 'BITS Pilani', college_domain: 'bits-pilani.ac.in',
    total_points: 1870, accepted_count: 26, response_count: 65,
    tier: 'Legend', streak: 9,
  },
  {
    rank: 3, helper_id: 'h-3', name: 'Rahul Verma',
    college_name: 'IIT Delhi', college_domain: 'iitd.ac.in',
    total_points: 1450, accepted_count: 21, response_count: 53,
    tier: 'Champion', streak: 7,
  },
  {
    rank: 4, helper_id: 'h-4', name: 'Sneha Reddy',
    college_name: 'IIIT Hyderabad', college_domain: 'iiit.ac.in',
    total_points: 1120, accepted_count: 16, response_count: 44,
    tier: 'Champion', streak: 5,
  },
  {
    rank: 5, helper_id: 'h-5', name: 'Aditya Patel',
    college_name: 'NIT Trichy', college_domain: 'nitt.edu',
    total_points: 980, accepted_count: 14, response_count: 39,
    tier: 'Champion', streak: 4,
  },
  {
    rank: 6, helper_id: 'h-6', name: 'Kavya Iyer',
    college_name: 'VIT Vellore', college_domain: 'vit.ac.in',
    total_points: 760, accepted_count: 11, response_count: 31,
    tier: 'Champion', streak: 3,
  },
  {
    rank: 7, helper_id: 'h-7', name: 'Vikram Singh',
    college_name: 'IIT Madras', college_domain: 'iitm.ac.in',
    total_points: 580, accepted_count: 8, response_count: 26,
    tier: 'Star', streak: 6,
  },
  {
    rank: 8, helper_id: 'h-8', name: 'Ananya Gupta',
    college_name: 'DTU Delhi', college_domain: 'dtu.ac.in',
    total_points: 430, accepted_count: 6, response_count: 22,
    tier: 'Star', streak: 2,
  },
  {
    rank: 9, helper_id: 'h-9', name: 'Rohan Desai',
    college_name: 'COEP Pune', college_domain: 'coep.org.in',
    total_points: 310, accepted_count: 4, response_count: 18,
    tier: 'Star', streak: 1,
  },
  {
    rank: 10, helper_id: 'h-10', name: 'Meera Nair',
    college_name: 'NIT Surathkal', college_domain: 'nitk.edu.in',
    total_points: 240, accepted_count: 3, response_count: 15,
    tier: 'Helper', streak: 2,
  },
  {
    rank: 11, helper_id: 'h-11', name: 'Siddharth Joshi',
    college_name: 'RVCE Bangalore', college_domain: 'rvce.edu.in',
    total_points: 180, accepted_count: 2, response_count: 12,
    tier: 'Helper', streak: 1,
  },
  {
    rank: 12, helper_id: 'h-12', name: 'Divya Menon',
    college_name: 'SRM Chennai', college_domain: 'srmist.edu.in',
    total_points: 130, accepted_count: 2, response_count: 9,
    tier: 'Helper', streak: 0,
  },
  {
    rank: 13, helper_id: 'h-13', name: 'Karthik Rao',
    college_name: 'PES University', college_domain: 'pes.edu',
    total_points: 85, accepted_count: 1, response_count: 7,
    tier: 'Seedling', streak: 1,
  },
  {
    rank: 14, helper_id: 'h-14', name: 'Neha Kulkarni',
    college_name: 'MIT Pune', college_domain: 'mitpune.edu.in',
    total_points: 55, accepted_count: 0, response_count: 5,
    tier: 'Seedling', streak: 0,
  },
  {
    rank: 15, helper_id: 'h-15', name: 'Amit Tiwari',
    college_name: 'BMS College', college_domain: 'bmsce.ac.in',
    total_points: 30, accepted_count: 0, response_count: 3,
    tier: 'Seedling', streak: 0,
  },
];

function TierBadge({ tier, size = 'sm' }: { tier: string; size?: 'sm' | 'md' | 'lg' }) {
  const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG];
  if (!config) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full bg-gradient-to-r ${config.gradient} text-white ${sizeClasses[size]}`}
    >
      {config.emoji} {config.label}
    </span>
  );
}

function PodiumCard({
  entry,
  position,
}: {
  entry: HelperLeaderboardEntry;
  position: 1 | 2 | 3;
}) {
  const medals = { 1: '1st', 2: '2nd', 3: '3rd' };
  const heights = { 1: 'h-32', 2: 'h-24', 3: 'h-20' };
  const widths = { 1: 'w-full max-w-[180px]', 2: 'w-full max-w-[160px]', 3: 'w-full max-w-[160px]' };
  const tierConfig = TIER_CONFIG[entry.tier];
  const order = { 1: 'order-2', 2: 'order-1', 3: 'order-3' };

  const initials = entry.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`flex flex-col items-center ${order[position]}`}>
      <div className="relative mb-2">
        <div
          className={`${position === 1 ? 'w-16 h-16' : 'w-14 h-14'} rounded-full bg-gradient-to-br ${tierConfig.gradient} flex items-center justify-center text-white font-bold text-base`}
        >
          {initials}
        </div>
        <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{medals[position]}</span>
      </div>

      <p className="font-bold text-slate-900 text-sm text-center line-clamp-1 max-w-[140px]">
        {entry.name}
      </p>

      <p className="text-xl font-black mt-1 text-slate-900">
        {entry.total_points.toLocaleString()}
      </p>
      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">points</p>

      <div
        className={`${widths[position]} ${heights[position]} mt-3 rounded-t-xl bg-gradient-to-t ${tierConfig.gradient} opacity-70 flex items-end justify-center pb-3`}
      >
        <span className="text-white font-black text-2xl opacity-30">#{position}</span>
      </div>
    </div>
  );
}

function LeaderboardRow({
  entry,
  isCurrentUser,
}: {
  entry: HelperLeaderboardEntry;
  isCurrentUser: boolean;
}) {
  const tierConfig = TIER_CONFIG[entry.tier];
  const initials = entry.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 transition-all duration-200 hover:bg-slate-50/80 ${
        isCurrentUser
          ? 'bg-amber-50/60 border-l-4 border-l-amber-500 ring-1 ring-amber-100'
          : 'border-b border-slate-100'
      }`}
    >
      {/* Rank */}
      <div className="w-10 text-center">
        <span className={`text-lg font-black ${isCurrentUser ? 'text-amber-600' : 'text-slate-400'}`}>
          {entry.rank}
        </span>
      </div>

      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full bg-gradient-to-br ${tierConfig.gradient} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}
      >
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-semibold text-sm truncate ${isCurrentUser ? 'text-amber-900' : 'text-slate-900'}`}>
            {entry.name}
            {isCurrentUser && (
              <span className="ml-2 text-[10px] uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                You
              </span>
            )}
          </p>
        </div>
        {entry.college_name && (
          <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
            <School className="w-3 h-3" />
            {entry.college_name}
          </p>
        )}
      </div>

      {/* Tier */}
      <TierBadge tier={entry.tier} size="sm" />

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-4 text-sm">
        <div className="text-center">
          <p className="font-bold text-slate-900">{entry.accepted_count}</p>
          <p className="text-[10px] text-slate-400 uppercase">Accepted</p>
        </div>
        {entry.streak > 0 && (
          <div className="flex items-center gap-0.5 text-amber-500">
            <Flame className="w-4 h-4" />
            <span className="font-bold">{entry.streak}</span>
          </div>
        )}
      </div>

      {/* Points */}
      <div className="text-right min-w-[60px]">
        <p className="text-lg font-black text-slate-900">{entry.total_points.toLocaleString()}</p>
        <p className="text-[10px] text-slate-400 uppercase tracking-wider">pts</p>
      </div>
    </div>
  );
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { scope?: string };
}) {
  const user = await getSession();
  if (!user) return null;

  const scope = searchParams.scope || 'national';

  let entries = [...PLATFORM_HELPERS];

  // Place the current user at a realistic position
  const currentUserEntry: HelperLeaderboardEntry = {
    rank: 4,
    helper_id: user.id,
    name: user.name,
    college_name: user.college_name || 'IIIT Hyderabad',
    college_domain: user.college_domain || 'iiit.ac.in',
    total_points: 1120,
    accepted_count: 16,
    response_count: 44,
    tier: 'Champion',
    streak: 5,
  };

  entries[3] = currentUserEntry;

  if (scope === 'college') {
    const collegeEntries: HelperLeaderboardEntry[] = [
      { ...entries[3], rank: 1 },
      {
        rank: 2, helper_id: 'c-2', name: 'Ravi Kumar',
        college_name: user.college_name || 'IIIT Hyderabad',
        college_domain: user.college_domain || 'iiit.ac.in',
        total_points: 680, accepted_count: 9, response_count: 28,
        tier: 'Star', streak: 3,
      },
      {
        rank: 3, helper_id: 'c-3', name: 'Pooja Reddy',
        college_name: user.college_name || 'IIIT Hyderabad',
        college_domain: user.college_domain || 'iiit.ac.in',
        total_points: 420, accepted_count: 5, response_count: 19,
        tier: 'Star', streak: 1,
      },
      {
        rank: 4, helper_id: 'c-4', name: 'Sai Teja',
        college_name: user.college_name || 'IIIT Hyderabad',
        college_domain: user.college_domain || 'iiit.ac.in',
        total_points: 210, accepted_count: 3, response_count: 11,
        tier: 'Helper', streak: 0,
      },
      {
        rank: 5, helper_id: 'c-5', name: 'Lakshmi Devi',
        college_name: user.college_name || 'IIIT Hyderabad',
        college_domain: user.college_domain || 'iiit.ac.in',
        total_points: 90, accepted_count: 1, response_count: 6,
        tier: 'Seedling', streak: 0,
      },
    ];
    entries = collegeEntries;
  }

  if (scope === 'regional') {
    entries = entries.slice(0, 10);
    entries.forEach((e, i) => (e.rank = i + 1));
  }

  const myEntry = entries.find(e => e.helper_id === user.id) || currentUserEntry;
  const isUserInTop50 = entries.some(e => e.helper_id === user.id);
  const top3 = entries.slice(0, 3);

  const tabs = [
    { label: 'College', value: 'college' },
    { label: 'Regional', value: 'regional' },
    { label: 'National', value: 'national' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-7 h-7 text-amber-400" />
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Leaderboard</h1>
        </div>
        <p className="text-slate-400 text-sm">
          Compete with fellow helpers and climb the ranks. Every solution earns you points.
        </p>

        {myEntry && (
          <div className="flex items-center gap-5 mt-6 flex-wrap">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Your Rank</p>
              <p className="text-2xl font-black">#{myEntry.rank}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Points</p>
              <p className="text-2xl font-black">{myEntry.total_points.toLocaleString()}</p>
            </div>
            <TierBadge tier={myEntry.tier} size="lg" />
            {myEntry.streak > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10 flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Streak</p>
                  <p className="text-xl font-black">{myEntry.streak} days</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-slate-200 shadow-sm">
        {tabs.map(tab => (
          <Link
            key={tab.value}
            href={`/helper/leaderboard?scope=${tab.value}`}
            className={`flex-1 text-center py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
              scope === tab.value
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Podium — top 3 */}
      {top3.length >= 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 overflow-hidden">
          <div className="flex items-center justify-center gap-3 mb-6">
            <h2 className="text-lg font-bold text-slate-900">Top Performers</h2>
          </div>
          <div className="flex items-end justify-center gap-4 sm:gap-6">
            <PodiumCard entry={top3[1]} position={2} />
            <PodiumCard entry={top3[0]} position={1} />
            <PodiumCard entry={top3[2]} position={3} />
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">Rankings</h2>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-3 py-1 font-medium">
            {entries.length} helpers
          </span>
        </div>

        <div className="divide-y-0">
          {entries.map(entry => (
            <LeaderboardRow
              key={entry.helper_id}
              entry={entry}
              isCurrentUser={entry.helper_id === user.id}
            />
          ))}

          {myEntry && !isUserInTop50 && (
            <>
              <div className="px-6 py-2 bg-slate-50 border-y border-slate-200">
                <p className="text-xs text-slate-400 text-center font-medium">· · ·</p>
              </div>
              <LeaderboardRow entry={myEntry} isCurrentUser={true} />
            </>
          )}
        </div>
      </div>

      {/* Link to stats */}
      <div className="text-center">
        <Link
          href="/helper/my-stats"
          className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold text-sm transition-colors"
        >
          View Your Detailed Stats
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
