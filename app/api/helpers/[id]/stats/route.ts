import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
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
  const { data: helper, error: helperErr } = await supabaseAdmin
    .from('users')
    .select('id, name, college_name, college_domain, profile_picture_url')
    .eq('id', helperId)
    .eq('role', 'helper')
    .single();

  if (helperErr || !helper) {
    return NextResponse.json({ error: 'Helper not found.' }, { status: 404 });
  }

  // Get total points
  const { data: pointEvents } = await supabaseAdmin
    .from('helper_points')
    .select('*')
    .eq('helper_id', helperId)
    .order('created_at', { ascending: false });

  const totalPoints = pointEvents?.reduce((sum, p) => sum + p.points, 0) || 0;

  // Get point breakdown by reason
  const breakdown: Record<string, number> = {};
  pointEvents?.forEach(p => {
    breakdown[p.reason] = (breakdown[p.reason] || 0) + p.points;
  });

  // Get streak
  const { data: streak } = await supabaseAdmin
    .from('helper_streaks')
    .select('*')
    .eq('helper_id', helperId)
    .single();

  // Get accepted count
  const { count: acceptedCount } = await supabaseAdmin
    .from('responses')
    .select('id', { count: 'exact', head: true })
    .eq('helper_id', helperId)
    .eq('accepted_by_senior', true);

  // Get total response count
  const { count: responseCount } = await supabaseAdmin
    .from('responses')
    .select('id', { count: 'exact', head: true })
    .eq('helper_id', helperId);

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
