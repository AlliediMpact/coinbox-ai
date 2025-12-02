'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import Logo from '@/components/Logo';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/components/AuthProvider';

export default function PublicHeader() {
  const pathname = usePathname();
  const isAuth = pathname.startsWith('/auth');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { effectiveTheme, setTheme } = useTheme();
  const { user } = useAuth();

  const isDashboardAvailable = !!user;

  const toggleTheme = () => {
    setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header
      className="w-full border-b shadow-sm sticky top-0 z-40"
      style={{ backgroundColor: '#193281' }}
    >
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 gap-2">
        {/* Left: Logo */}
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4 text-white">
          <Link href="/about" className="text-sm hover:underline">
            About
          </Link>
          <Link href="/help-center" className="text-sm hover:underline">
            Help Center
          </Link>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            aria-label="Toggle theme"
            onClick={toggleTheme}
          >
            {effectiveTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Auth / dashboard actions */}
          {!isAuth && !isDashboardAvailable && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/auth">Sign In</Link>
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                asChild
              >
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </>
          )}

          {isDashboardAvailable && (
            <Button
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
              asChild
            >
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          )}
        </nav>

        {/* Right: theme + mobile menu on small screens */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            aria-label="Toggle theme"
            onClick={toggleTheme}
          >
            {effectiveTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#193281] text-white">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
            <Link
              href="/about"
              className="block text-sm hover:underline"
              onClick={() => setMobileOpen(false)}
            >
              About
            </Link>
            <Link
              href="/help-center"
              className="block text-sm hover:underline"
              onClick={() => setMobileOpen(false)}
            >
              Help Center
            </Link>

            {!isAuth && !isDashboardAvailable && (
              <div className="pt-2 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white hover:bg-white/10 w-full"
                  asChild
                >
                  <Link href="/auth" onClick={() => setMobileOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 w-full"
                  asChild
                >
                  <Link href="/auth/signup" onClick={() => setMobileOpen(false)}>
                    Sign Up
                  </Link>
                </Button>
              </div>
            )}

            {isDashboardAvailable && (
              <div className="pt-2">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 w-full"
                  asChild
                >
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                    Go to dashboard
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
