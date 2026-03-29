'use client';

import { User } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavBarProps {
  user: User;
  navItems: { label: string; href: string }[];
}

export default function NavBar({ user, navItems }: NavBarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('linkage_auth_email');
      router.push('/');
    } catch (error) {
      // silent fail — redirect anyway
      router.push('/');
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between h-14 items-center">
          {/* Logo */}
          <Link href={`/${user.role}/dashboard`} className="flex-shrink-0 flex items-center gap-2">
            <span className="text-lg font-bold text-slate-900 tracking-tight">LinkAge</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider border border-amber-200">
              {user.role}
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden sm:flex sm:items-center sm:space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side: name + logout */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 font-medium hidden sm:inline">
              {user.name.split(' ')[0]}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-slate-400 active:text-slate-600 active:bg-slate-100 w-10 h-10 rounded-full touch-target"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
