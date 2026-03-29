'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Trophy, BarChart3, Mic, FolderOpen } from 'lucide-react';

interface BottomNavProps {
  role: 'helper' | 'senior';
}

const helperTabs = [
  { label: 'Home', href: '/helper/dashboard', icon: Home },
  { label: 'Browse', href: '/helper/browse', icon: Search },
  { label: 'Leaderboard', href: '/helper/leaderboard', icon: Trophy },
  { label: 'Stats', href: '/helper/my-stats', icon: BarChart3 },
];

const seniorTabs = [
  { label: 'Home', href: '/senior/dashboard', icon: Home },
  { label: 'Ask', href: '/senior/new-request', icon: Mic },
  { label: 'History', href: '/senior/my-requests', icon: FolderOpen },
];

export default function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const tabs = role === 'helper' ? helperTabs : seniorTabs;
  const isSenior = role === 'senior';

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-slate-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className={`flex items-center justify-around ${isSenior ? 'h-20' : 'h-16'}`}>
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 active:bg-slate-50 transition-colors touch-target ${
                isActive ? 'text-amber-600' : 'text-slate-400'
              }`}
            >
              <Icon className={`${isSenior ? 'w-7 h-7' : 'w-5 h-5'} ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className={`${isSenior ? 'text-xs' : 'text-[10px]'} font-bold tracking-wide ${isActive ? 'text-amber-600' : 'text-slate-400'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-0 w-10 h-1 rounded-full bg-amber-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
