'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home', public: true },
    { href: '/emergency/new', label: 'Request Blood', public: true },
    { href: '/banks/nearby', label: 'Blood Banks', public: true },
    { href: '/map', label: '🗺️ Live Map', public: true },
    { href: '/analytics', label: '📊 Analytics', public: true },
    { href: '/donor/dashboard', label: 'Donor Dashboard', roles: ['donor'] },
    { href: '/hospital/dashboard', label: 'Hospital', roles: ['hospital'] },
  ];

  const filteredLinks = navLinks.filter((link) => {
    if (link.public) return true;
    if (!user) return false;
    return link.roles?.includes(user.role);
  });

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform">
              P
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
              PulseLink
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {filteredLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === link.href ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/80 rounded-full">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold">
                    {user.name?.charAt(0)}
                  </div>
                  <span className="text-sm text-gray-300">{user.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-700 rounded-full text-gray-400 capitalize">{user.role}</span>
                </div>
                <button onClick={logout} className="text-sm text-gray-400 hover:text-red-400 transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Login</Link>
                <Link href="/register" className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-sm font-medium rounded-lg transition-all">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-900/95 border-t border-gray-800 px-4 py-4 space-y-2">
          {filteredLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm ${pathname === link.href ? 'bg-red-500/20 text-red-400' : 'text-gray-400'}`}>
              {link.label}
            </Link>
          ))}
          {user ? (
            <button onClick={() => { logout(); setMobileOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-red-400">Logout</button>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center px-3 py-2 text-sm text-gray-400 bg-gray-800 rounded-lg">Login</Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center px-3 py-2 text-sm text-white bg-red-600 rounded-lg">Register</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
