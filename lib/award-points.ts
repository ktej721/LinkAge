import { supabaseAdmin } from '@/lib/supabase-server';
import { MILESTONE_THRESHOLDS } from '@/lib/tiers';

/**
 * Award points to a helper. Call this from API routes after point-earning events.
 *
 * Handles:
 * - Inserting the point event into helper_points
 * - Checking & awarding milestone bonuses (idempotent)
 * - Updating helper_streaks (first-daily-response bonus + streak tracking)
 */
export async function awardPoints(
  helperId: string,
  points: number,
  reason: string,
  referenceId?: string
): Promise<void> {
  // 1. Insert the point event
  await supabaseAdmin.from('helper_points').insert({
    helper_id: helperId,
    points,
    reason,
    reference_id: referenceId || null,
  });

  // 2. Handle streak logic — first response of the day gets +10 bonus
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const { data: streak } = await supabaseAdmin
    .from('helper_streaks')
    .select('*')
    .eq('helper_id', helperId)
    .maybeSingle();

  if (!streak) {
    // First ever activity — create streak record
    await supabaseAdmin.from('helper_streaks').insert({
      helper_id: helperId,
      current_streak: 1,
      last_active_date: today,
      longest_streak: 1,
    });

    // First daily response bonus
    await supabaseAdmin.from('helper_points').insert({
      helper_id: helperId,
      points: 10,
      reason: 'first_daily_response',
      reference_id: referenceId || null,
    });
  } else {
    const lastActive = streak.last_active_date || null;

    if (lastActive !== today) {
      // Not yet active today
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak: number;
      if (lastActive === yesterdayStr) {
        // Consecutive day — increment streak
        newStreak = streak.current_streak + 1;
      } else {
        // Streak broken — reset to 1
        newStreak = 1;
      }

      const longestStreak = Math.max(newStreak, streak.longest_streak);

      await supabaseAdmin
        .from('helper_streaks')
        .update({
          current_streak: newStreak,
          last_active_date: today,
          longest_streak: longestStreak,
        })
        .eq('helper_id', helperId);

      // First daily response bonus
      await supabaseAdmin.from('helper_points').insert({
        helper_id: helperId,
        points: 10,
        reason: 'first_daily_response',
        reference_id: referenceId || null,
      });
    }
    // If already active today, no streak update or daily bonus needed.
  }

  // 3. Check milestone thresholds (only for 'accepted_by_senior' events)
  if (reason === 'accepted_by_senior') {
    const { count } = await supabaseAdmin
      .from('responses')
      .select('id', { count: 'exact', head: true })
      .eq('helper_id', helperId)
      .eq('accepted_by_senior', true);

    const acceptedCount = count || 0;

    for (const milestone of MILESTONE_THRESHOLDS) {
      if (acceptedCount >= milestone.count) {
        // Check if milestone bonus was already awarded (idempotent)
        const { data: existing } = await supabaseAdmin
          .from('helper_points')
          .select('id')
          .eq('helper_id', helperId)
          .eq('reason', milestone.reason)
          .maybeSingle();

        if (!existing) {
          await supabaseAdmin.from('helper_points').insert({
            helper_id: helperId,
            points: milestone.bonus,
            reason: milestone.reason,
            reference_id: null,
          });
        }
      }
    }
  }
}
