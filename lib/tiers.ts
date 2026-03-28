import { HelperTier } from '@/types';

export function getTierFromPoints(points: number): HelperTier {
  if (points >= 1500) return 'Legend';
  if (points >= 700) return 'Champion';
  if (points >= 300) return 'Star';
  if (points >= 100) return 'Helper';
  return 'Seedling';
}

export const TIER_CONFIG: Record<HelperTier, {
  emoji: string;
  label: string;
  color: string;
  gradient: string;
  glowColor: string;
  bgGradient: string;
  minPoints: number;
  maxPoints: number | null;
}> = {
  Seedling: {
    emoji: '🌱',
    label: 'New Helper',
    color: '#22c55e',
    gradient: 'from-green-400 to-emerald-600',
    glowColor: 'shadow-green-500/25',
    bgGradient: 'from-green-500/10 to-emerald-500/10',
    minPoints: 0,
    maxPoints: 99,
  },
  Helper: {
    emoji: '🔵',
    label: 'Active Helper',
    color: '#3b82f6',
    gradient: 'from-blue-400 to-indigo-600',
    glowColor: 'shadow-blue-500/25',
    bgGradient: 'from-blue-500/10 to-indigo-500/10',
    minPoints: 100,
    maxPoints: 299,
  },
  Star: {
    emoji: '⭐',
    label: 'Rising Star',
    color: '#eab308',
    gradient: 'from-yellow-400 to-amber-600',
    glowColor: 'shadow-yellow-500/25',
    bgGradient: 'from-yellow-500/10 to-amber-500/10',
    minPoints: 300,
    maxPoints: 699,
  },
  Champion: {
    emoji: '🔥',
    label: 'Community Champion',
    color: '#f97316',
    gradient: 'from-orange-400 to-red-600',
    glowColor: 'shadow-orange-500/25',
    bgGradient: 'from-orange-500/10 to-red-500/10',
    minPoints: 700,
    maxPoints: 1499,
  },
  Legend: {
    emoji: '💎',
    label: 'LinkAge Legend',
    color: '#a855f7',
    gradient: 'from-purple-400 to-fuchsia-600',
    glowColor: 'shadow-purple-500/25',
    bgGradient: 'from-purple-500/10 to-fuchsia-500/10',
    minPoints: 1500,
    maxPoints: null,
  },
};

export const MILESTONE_THRESHOLDS = [
  { count: 5, bonus: 100, reason: 'milestone_5' },
  { count: 10, bonus: 250, reason: 'milestone_10' },
  { count: 25, bonus: 500, reason: 'milestone_25' },
] as const;
