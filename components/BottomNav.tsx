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
  { label: 'My Requests', href: '/senior/my-requests', icon: FolderOpen },
];

export default function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const tabs = role === 'helper' ? helperTabs : seniorTabs;
  const activeColor = role === 'helper' ? 'text-teal-600' : 'text-orange-600';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200 sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${
                isActive ? activeColor : 'text-gray-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className={`text-[10px] font-semibold tracking-wide ${isActive ? '' : 'text-gray-400'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span
                  className={`absolute top-0 w-8 h-0.5 rounded-full ${
                    role === 'helper' ? 'bg-teal-600' : 'bg-orange-500'
                  }`}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
