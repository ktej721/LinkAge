import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getSession } from '@/lib/auth';
import { getTierFromPoints } from '@/lib/tiers';
import { HelperLeaderboardEntry } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get('scope') || 'national';

  // Base query: aggregate points per helper
  let query = supabaseAdmin
    .from('users')
    .select(`
      id,
      name,
      college_name,
      college_domain,
      profile_picture_url
    `)
    .eq('role', 'helper');

  // If college scope, filter by current user's college_domain
  if (scope === 'college' && user.college_domain) {
    query = query.eq('college_domain', user.college_domain);
  }

  const { data: helpers, error: helpersError } = await query;

  if (helpersError) {
    return NextResponse.json({ error: helpersError.message }, { status: 500 });
  }

  if (!helpers || helpers.length === 0) {
    return NextResponse.json({
      data: [],
      my_rank: null,
    });
  }

  const helperIds = helpers.map(h => h.id);

  // Get total points for each helper
  const { data: pointsData } = await supabaseAdmin
    .from('helper_points')
    .select('helper_id, points')
    .in('helper_id', helperIds);

  // Get accepted counts
  const { data: acceptedData } = await supabaseAdmin
    .from('responses')
    .select('helper_id')
    .in('helper_id', helperIds)
    .eq('accepted_by_senior', true);

  // Get total response counts
  const { data: responseData } = await supabaseAdmin
    .from('responses')
    .select('helper_id')
    .in('helper_id', helperIds);

  // Get streaks
  const { data: streakData } = await supabaseAdmin
    .from('helper_streaks')
    .select('helper_id, current_streak')
    .in('helper_id', helperIds);

  // Aggregate
  const pointsByHelper: Record<string, number> = {};
  const acceptedByHelper: Record<string, number> = {};
  const responsesByHelper: Record<string, number> = {};
  const streakByHelper: Record<string, number> = {};

  pointsData?.forEach(p => {
    pointsByHelper[p.helper_id] = (pointsByHelper[p.helper_id] || 0) + p.points;
  });

  acceptedData?.forEach(a => {
    acceptedByHelper[a.helper_id] = (acceptedByHelper[a.helper_id] || 0) + 1;
  });

  responseData?.forEach(r => {
    responsesByHelper[r.helper_id] = (responsesByHelper[r.helper_id] || 0) + 1;
  });

  streakData?.forEach(s => {
    streakByHelper[s.helper_id] = s.current_streak;
  });

  // Build leaderboard entries
  let entries: HelperLeaderboardEntry[] = helpers.map(h => {
    const totalPoints = pointsByHelper[h.id] || 0;
    return {
      rank: 0,
      helper_id: h.id,
      name: h.name,
      college_name: h.college_name || undefined,
      college_domain: h.college_domain || undefined,
      total_points: totalPoints,
      accepted_count: acceptedByHelper[h.id] || 0,
      response_count: responsesByHelper[h.id] || 0,
      tier: getTierFromPoints(totalPoints),
      streak: streakByHelper[h.id] || 0,
      profile_picture_url: h.profile_picture_url || undefined,
    };
  });

  // Sort by total_points descending
  entries.sort((a, b) => b.total_points - a.total_points);

  // Assign ranks
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  // For regional scope: return college-level aggregates + top individual per college
  if (scope === 'regional') {
    // Group by college
    const collegeMap: Record<string, { total: number; entries: HelperLeaderboardEntry[] }> = {};
    entries.forEach(e => {
      const key = e.college_name || 'Unknown';
      if (!collegeMap[key]) {
        collegeMap[key] = { total: 0, entries: [] };
      }
      collegeMap[key].total += e.total_points;
      collegeMap[key].entries.push(e);
    });

    // Still return individual entries but sorted by college then rank
    // The UI can group them
  }

  // Find current user's rank
  const myEntry = entries.find(e => e.helper_id === user.id);

  // Return top 50 + user's own rank
  const top50 = entries.slice(0, 50);

  return NextResponse.json({
    data: top50,
    my_rank: myEntry || null,
  });
}
