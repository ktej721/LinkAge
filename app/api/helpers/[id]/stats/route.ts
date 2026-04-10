import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getTierFromPoints, MILESTONE_THRESHOLDS, TIER_CONFIG } from '@/lib/tiers';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const helperId = params.id;

  // Verify helper exists
  const helper = await prisma.user.findFirst({
    where: { id: helperId, role: 'helper' },
    select: { id: true, name: true, college_name: true, college_domain: true, profile_picture_url: true }
  });

  if (!helper) {
    return NextResponse.json({ error: 'Helper not found.' }, { status: 404 });
  }

  // Get total points
  const pointEvents = await prisma.helperPoint.findMany({
    where: { helper_id: helperId },
    orderBy: { created_at: 'desc' }
  });

  const totalPoints = pointEvents?.reduce((sum: any, p: any) => sum + p.points, 0) || 0;

  // Get point breakdown by reason
  const breakdown: Record<string, number> = {};
  pointEvents?.forEach((p: any) => {
    breakdown[p.reason] = (breakdown[p.reason] || 0) + p.points;
  });

  // Get streak
  const streak = await prisma.helperStreak.findUnique({
    where: { helper_id: helperId }
  });

  // Get accepted count
  const acceptedCount = await prisma.response.count({
    where: { helper_id: helperId, accepted_by_senior: true }
  });

  // Get total response count
  const responseCount = await prisma.response.count({
    where: { helper_id: helperId }
  });

  // Determine milestones achieved
  const milestonesAchieved = MILESTONE_THRESHOLDS.filter(
    m => (acceptedCount || 0) >= m.count
  ).map(m => ({
    count: m.count,
    bonus: m.bonus,
    reason: m.reason,
    achieved: true,
  }));

  // Next milestone
  const nextMilestone = MILESTONE_THRESHOLDS.find(
    m => (acceptedCount || 0) < m.count
  );

  const tier = getTierFromPoints(totalPoints);
  const tierConfig = TIER_CONFIG[tier];

  return NextResponse.json({
    helper_id: helperId,
    name: helper.name,
    college_name: helper.college_name,
    profile_picture_url: helper.profile_picture_url,
    total_points: totalPoints,
    tier,
    tier_config: tierConfig,
    streak: streak ? {
      current_streak: streak.current_streak,
      longest_streak: streak.longest_streak,
      last_active_date: streak.last_active_date,
    } : { current_streak: 0, longest_streak: 0, last_active_date: null },
    accepted_count: acceptedCount || 0,
    response_count: responseCount || 0,
    point_breakdown: breakdown,
    milestones_achieved: milestonesAchieved,
    next_milestone: nextMilestone ? {
      count: nextMilestone.count,
      bonus: nextMilestone.bonus,
      current: acceptedCount || 0,
    } : null,
    recent_events: (pointEvents || []).slice(0, 20),
  });
}
