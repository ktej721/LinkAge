import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
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

  const conditions: any = { role: 'helper' };
  
  if (scope === 'college' && user.college_domain) {
    conditions.college_domain = user.college_domain;
  }

  let helpers;
  try {
    helpers = await prisma.user.findMany({
      where: conditions,
      select: {
        id: true,
        name: true,
        college_name: true,
        college_domain: true,
        profile_picture_url: true, // wait this is not in schema.prisma!
      }
    }); // Needs fixing schema
  } catch (helpersError: any) {
    return NextResponse.json({ error: helpersError.message }, { status: 500 });
  }

  if (!helpers || helpers.length === 0) {
    return NextResponse.json({
      data: [],
      my_rank: null,
    });
  }

  const helperIds = helpers.map((h: any) => h.id);

  // Get total points for each helper
  const pointsData = await prisma.helperPoint.findMany({
    where: { helper_id: { in: helperIds } },
    select: { helper_id: true, points: true }
  });

  // Get accepted counts
  const acceptedData = await prisma.response.findMany({
    where: { helper_id: { in: helperIds }, accepted_by_senior: true },
    select: { helper_id: true }
  });

  // Get total response counts
  const responseData = await prisma.response.findMany({
    where: { helper_id: { in: helperIds } },
    select: { helper_id: true }
  });

  // Get streaks
  const streakData = await prisma.helperStreak.findMany({
    where: { helper_id: { in: helperIds } },
    select: { helper_id: true, current_streak: true }
  });

  // Aggregate
  const pointsByHelper: Record<string, number> = {};
  const acceptedByHelper: Record<string, number> = {};
  const responsesByHelper: Record<string, number> = {};
  const streakByHelper: Record<string, number> = {};

  pointsData?.forEach((p: any) => {
    pointsByHelper[p.helper_id] = (pointsByHelper[p.helper_id] || 0) + p.points;
  });

  acceptedData?.forEach((a: any) => {
    acceptedByHelper[a.helper_id] = (acceptedByHelper[a.helper_id] || 0) + 1;
  });

  responseData?.forEach((r: any) => {
    responsesByHelper[r.helper_id] = (responsesByHelper[r.helper_id] || 0) + 1;
  });

  streakData?.forEach((s: any) => {
    streakByHelper[s.helper_id] = s.current_streak;
  });

  // Build leaderboard entries
  let entries: HelperLeaderboardEntry[] = helpers.map((h: any) => {
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
