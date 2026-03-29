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
    color: '#78716c',
    gradient: 'from-stone-400 to-stone-600',
    glowColor: 'shadow-stone-400/15',
    bgGradient: 'from-stone-100 to-stone-50',
    minPoints: 0,
    maxPoints: 99,
  },
  Helper: {
    emoji: '🤝',
    label: 'Active Helper',
    color: '#92400e',
    gradient: 'from-amber-600 to-amber-800',
    glowColor: 'shadow-amber-500/15',
    bgGradient: 'from-amber-50 to-amber-100/50',
    minPoints: 100,
    maxPoints: 299,
  },
  Star: {
    emoji: '⭐',
    label: 'Rising Star',
    color: '#b45309',
    gradient: 'from-amber-500 to-amber-700',
    glowColor: 'shadow-amber-500/15',
    bgGradient: 'from-amber-50 to-orange-50',
    minPoints: 300,
    maxPoints: 699,
  },
  Champion: {
    emoji: '🏅',
    label: 'Community Champion',
    color: '#d97706',
    gradient: 'from-amber-500 to-amber-600',
    glowColor: 'shadow-amber-500/20',
    bgGradient: 'from-amber-50 to-yellow-50',
    minPoints: 700,
    maxPoints: 1499,
  },
  Legend: {
    emoji: '👑',
    label: 'LinkAge Legend',
    color: '#1e293b',
    gradient: 'from-slate-700 to-slate-900',
    glowColor: 'shadow-slate-500/20',
    bgGradient: 'from-slate-50 to-slate-100',
    minPoints: 1500,
    maxPoints: null,
  },
};

export const MILESTONE_THRESHOLDS = [
  { count: 5, bonus: 100, reason: 'milestone_5' },
  { count: 10, bonus: 250, reason: 'milestone_10' },
  { count: 25, bonus: 500, reason: 'milestone_25' },
] as const;
