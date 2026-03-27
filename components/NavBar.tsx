'use client';

import { User } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface NavBarProps {
  user: User;
  navItems: { label: string; href: string }[];
}

export default function NavBar({ user, navItems }: NavBarProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('linkage_auth_email');
      router.push('/');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={`/${user.role}/dashboard`} className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-indigo-600 tracking-tight">🔗 LinkAge</span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider hidden sm:inline-block">
                {user.role}
              </span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center gap-4">
            <span className="text-sm text-gray-700 font-medium">Hello, {user.name.split(' ')[0]}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
          <div className="flex items-center sm:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="w-5 h-5 text-gray-500" />
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="sm:hidden border-t border-gray-200 bg-white">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 hover:border-red-300"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
