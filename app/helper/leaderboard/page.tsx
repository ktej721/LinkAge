import { getSession } from '@/lib/auth';
import { getTierFromPoints, TIER_CONFIG } from '@/lib/tiers';
import { HelperLeaderboardEntry, HelperTier } from '@/types';
import Link from 'next/link';
import { Trophy, Flame, ChevronRight, Sparkles, TrendingUp, School } from 'lucide-react';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════
// DEMO DATA — hardcoded for hackathon presentation
// ═══════════════════════════════════════════════════════════
const DEMO_HELPERS: HelperLeaderboardEntry[] = [
  {
    rank: 1, helper_id: 'demo-1', name: 'Arjun Mehta',
    college_name: 'IIT Bombay', college_domain: 'iitb.ac.in',
    total_points: 2340, accepted_count: 32, response_count: 78,
    tier: 'Legend', streak: 14,
  },
  {
    rank: 2, helper_id: 'demo-2', name: 'Priya Sharma',
    college_name: 'BITS Pilani', college_domain: 'bits-pilani.ac.in',
    total_points: 1870, accepted_count: 26, response_count: 65,
    tier: 'Legend', streak: 9,
  },
  {
    rank: 3, helper_id: 'demo-3', name: 'Rahul Verma',
    college_name: 'IIT Delhi', college_domain: 'iitd.ac.in',
    total_points: 1450, accepted_count: 21, response_count: 53,
    tier: 'Champion', streak: 7,
  },
  {
    rank: 4, helper_id: 'demo-4', name: 'Sneha Reddy',
    college_name: 'IIIT Hyderabad', college_domain: 'iiit.ac.in',
    total_points: 1120, accepted_count: 16, response_count: 44,
    tier: 'Champion', streak: 5,
  },
  {
    rank: 5, helper_id: 'demo-5', name: 'Aditya Patel',
    college_name: 'NIT Trichy', college_domain: 'nitt.edu',
    total_points: 980, accepted_count: 14, response_count: 39,
    tier: 'Champion', streak: 4,
  },
  {
    rank: 6, helper_id: 'demo-6', name: 'Kavya Iyer',
    college_name: 'VIT Vellore', college_domain: 'vit.ac.in',
    total_points: 760, accepted_count: 11, response_count: 31,
    tier: 'Champion', streak: 3,
  },
  {
    rank: 7, helper_id: 'demo-7', name: 'Vikram Singh',
    college_name: 'IIT Madras', college_domain: 'iitm.ac.in',
    total_points: 580, accepted_count: 8, response_count: 26,
    tier: 'Star', streak: 6,
  },
  {
    rank: 8, helper_id: 'demo-8', name: 'Ananya Gupta',
    college_name: 'DTU Delhi', college_domain: 'dtu.ac.in',
    total_points: 430, accepted_count: 6, response_count: 22,
    tier: 'Star', streak: 2,
  },
  {
    rank: 9, helper_id: 'demo-9', name: 'Rohan Desai',
    college_name: 'COEP Pune', college_domain: 'coep.org.in',
    total_points: 310, accepted_count: 4, response_count: 18,
    tier: 'Star', streak: 1,
  },
  {
    rank: 10, helper_id: 'demo-10', name: 'Meera Nair',
    college_name: 'NIT Surathkal', college_domain: 'nitk.edu.in',
    total_points: 240, accepted_count: 3, response_count: 15,
    tier: 'Helper', streak: 2,
  },
  {
    rank: 11, helper_id: 'demo-11', name: 'Siddharth Joshi',
    college_name: 'RVCE Bangalore', college_domain: 'rvce.edu.in',
    total_points: 180, accepted_count: 2, response_count: 12,
    tier: 'Helper', streak: 1,
  },
  {
    rank: 12, helper_id: 'demo-12', name: 'Divya Menon',
    college_name: 'SRM Chennai', college_domain: 'srmist.edu.in',
    total_points: 130, accepted_count: 2, response_count: 9,
    tier: 'Helper', streak: 0,
  },
  {
    rank: 13, helper_id: 'demo-13', name: 'Karthik Rao',
    college_name: 'PES University', college_domain: 'pes.edu',
    total_points: 85, accepted_count: 1, response_count: 7,
    tier: 'Seedling', streak: 1,
  },
  {
    rank: 14, helper_id: 'demo-14', name: 'Neha Kulkarni',
    college_name: 'MIT Pune', college_domain: 'mitpune.edu.in',
    total_points: 55, accepted_count: 0, response_count: 5,
    tier: 'Seedling', streak: 0,
  },
  {
    rank: 15, helper_id: 'demo-15', name: 'Amit Tiwari',
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
      className={`inline-flex items-center gap-1 font-semibold rounded-full bg-gradient-to-r ${config.gradient} text-white ${sizeClasses[size]} shadow-lg ${config.glowColor}`}
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
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const heights = { 1: 'h-36', 2: 'h-28', 3: 'h-24' };
  const widths = { 1: 'w-full max-w-[200px]', 2: 'w-full max-w-[180px]', 3: 'w-full max-w-[180px]' };
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
          className={`${position === 1 ? 'w-20 h-20' : 'w-16 h-16'} rounded-full bg-gradient-to-br ${tierConfig.gradient} flex items-center justify-center text-white font-bold text-lg shadow-xl ${tierConfig.glowColor}`}
          style={{ boxShadow: `0 0 20px ${tierConfig.color}40` }}
        >
          {initials}
        </div>
        <span className="absolute -top-1 -right-1 text-2xl">{medals[position]}</span>
      </div>

      <p className="font-bold text-gray-900 text-sm text-center line-clamp-1 max-w-[150px]">
        {entry.name}
      </p>

      <p className="text-2xl font-black mt-1" style={{ color: tierConfig.color }}>
        {entry.total_points.toLocaleString()}
      </p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">points</p>

      <div
        className={`${widths[position]} ${heights[position]} mt-3 rounded-t-2xl bg-gradient-to-t ${tierConfig.gradient} opacity-80 flex items-end justify-center pb-3`}
      >
        <span className="text-white font-black text-3xl opacity-40">#{position}</span>
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
      className={`flex items-center gap-4 px-5 py-4 transition-all duration-200 hover:bg-gray-50/80 ${
        isCurrentUser
          ? 'bg-indigo-50/70 border-l-4 border-l-indigo-500 ring-1 ring-indigo-100'
          : 'border-b border-gray-100'
      }`}
    >
      {/* Rank */}
      <div className="w-10 text-center">
        <span className={`text-xl font-black ${isCurrentUser ? 'text-indigo-600' : 'text-gray-400'}`}>
          {entry.rank}
        </span>
      </div>

      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full bg-gradient-to-br ${tierConfig.gradient} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}
        style={{ boxShadow: `0 0 12px ${tierConfig.color}30` }}
      >
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-semibold text-sm truncate ${isCurrentUser ? 'text-indigo-900' : 'text-gray-900'}`}>
            {entry.name}
            {isCurrentUser && (
              <span className="ml-2 text-[10px] uppercase tracking-wider bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">
                You
              </span>
            )}
          </p>
        </div>
        {entry.college_name && (
          <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
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
          <p className="font-bold text-gray-900">{entry.accepted_count}</p>
          <p className="text-[10px] text-gray-500 uppercase">Accepted</p>
        </div>
        {entry.streak > 0 && (
          <div className="flex items-center gap-0.5 text-orange-500">
            <Flame className="w-4 h-4" />
            <span className="font-bold">{entry.streak}</span>
          </div>
        )}
      </div>

      {/* Points */}
      <div className="text-right min-w-[60px]">
        <p className="text-lg font-black text-gray-900">{entry.total_points.toLocaleString()}</p>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">pts</p>
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

  // ═══════════════════════════════════════════════════
  // Use DEMO data — inject the current logged-in user
  // into the leaderboard at a realistic position
  // ═══════════════════════════════════════════════════
  let entries = [...DEMO_HELPERS];

  // Place the real user at rank 4 with good stats for demo
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

  // Replace entry at position 4 with the real user
  entries[3] = currentUserEntry;

  // If college scope, filter to show only a few "same college" entries
  if (scope === 'college') {
    const collegeEntries: HelperLeaderboardEntry[] = [
      { ...entries[3], rank: 1 }, // Current user at #1 in college
      {
        rank: 2, helper_id: 'college-2', name: 'Ravi Kumar',
        college_name: user.college_name || 'IIIT Hyderabad',
        college_domain: user.college_domain || 'iiit.ac.in',
        total_points: 680, accepted_count: 9, response_count: 28,
        tier: 'Star', streak: 3,
      },
      {
        rank: 3, helper_id: 'college-3', name: 'Pooja Reddy',
        college_name: user.college_name || 'IIIT Hyderabad',
        college_domain: user.college_domain || 'iiit.ac.in',
        total_points: 420, accepted_count: 5, response_count: 19,
        tier: 'Star', streak: 1,
      },
      {
        rank: 4, helper_id: 'college-4', name: 'Sai Teja',
        college_name: user.college_name || 'IIIT Hyderabad',
        college_domain: user.college_domain || 'iiit.ac.in',
        total_points: 210, accepted_count: 3, response_count: 11,
        tier: 'Helper', streak: 0,
      },
      {
        rank: 5, helper_id: 'college-5', name: 'Lakshmi Devi',
        college_name: user.college_name || 'IIIT Hyderabad',
        college_domain: user.college_domain || 'iiit.ac.in',
        total_points: 90, accepted_count: 1, response_count: 6,
        tier: 'Seedling', streak: 0,
      },
    ];
    entries = collegeEntries;
  }

  // For regional scope, keep national but rerank
  if (scope === 'regional') {
    // Show top by region — same data but label as regional
    entries = entries.slice(0, 10);
    entries.forEach((e, i) => (e.rank = i + 1));
  }

  const myEntry = entries.find(e => e.helper_id === user.id) || currentUserEntry;
  const isUserInTop50 = entries.some(e => e.helper_id === user.id);
  const top3 = entries.slice(0, 3);

  const tabs = [
    { label: '🏫 College', value: 'college' },
    { label: '🗺️ Regional', value: 'regional' },
    { label: '🇮🇳 National', value: 'national' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIxLjUiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-70" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-300" />
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Leaderboard</h1>
          </div>
          <p className="text-indigo-100 text-sm sm:text-base">
            Compete with fellow helpers and climb the ranks. Every solution you provide earns you points!
          </p>

          {/* Quick stats for current user */}
          {myEntry && (
            <div className="flex items-center gap-6 mt-6 flex-wrap">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
                <p className="text-xs text-indigo-200 uppercase tracking-wider font-medium">Your Rank</p>
                <p className="text-3xl font-black">#{myEntry.rank}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
                <p className="text-xs text-indigo-200 uppercase tracking-wider font-medium">Points</p>
                <p className="text-3xl font-black">{myEntry.total_points.toLocaleString()}</p>
              </div>
              <div>
                <TierBadge tier={myEntry.tier} size="lg" />
              </div>
              {myEntry.streak > 0 && (
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-300" />
                  <div>
                    <p className="text-xs text-indigo-200 uppercase tracking-wider font-medium">Streak</p>
                    <p className="text-2xl font-black">{myEntry.streak} days</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-2xl p-1.5 border border-gray-200 shadow-sm">
        {tabs.map(tab => (
          <Link
            key={tab.value}
            href={`/helper/leaderboard?scope=${tab.value}`}
            className={`flex-1 text-center py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
              scope === tab.value
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Podium — top 3 */}
      {top3.length >= 3 && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 overflow-hidden">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl font-black text-gray-900">Top Performers</h2>
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="flex items-end justify-center gap-4 sm:gap-6">
            <PodiumCard entry={top3[1]} position={2} />
            <PodiumCard entry={top3[0]} position={1} />
            <PodiumCard entry={top3[2]} position={3} />
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Rankings</h2>
          </div>
          <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1 font-medium">
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

          {/* Current user outside top 50 */}
          {myEntry && !isUserInTop50 && (
            <>
              <div className="px-6 py-2 bg-gray-50 border-y border-gray-200">
                <p className="text-xs text-gray-500 text-center font-medium">• • •</p>
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
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold text-sm transition-colors"
        >
          📊 View Your Detailed Stats
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
