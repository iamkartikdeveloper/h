'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  Code2,
  BookOpen,
  FolderGit2,
  User,
  Mail,
  Search,
  Menu,
  X,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { YouTubeIcon } from '@/components/ui/Icons';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hide public navbar on admin pages to keep admin dashboard clean & dedicated
  const isAdminPage = pathname.startsWith('/admin');
  if (isAdminPage) return null;

  const navLinks = [
    { href: '/', label: 'Home', icon: Code2 },
    { href: '/tutorials', label: 'Tutorials', icon: BookOpen },
    { href: '/projects', label: 'Projects', icon: FolderGit2 },
    { href: '/about', label: 'About', icon: User },
    { href: '/contact', label: 'Contact', icon: Mail },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400 text-lg">
                &lt;K/&gt;
              </span>
            </div>
          </div>
          <div>
            <span className="font-bold text-white text-base tracking-tight group-hover:text-indigo-400 transition-colors">
              Kartik Sharma
            </span>
            <span className="block text-[10px] text-slate-400 font-mono tracking-widest uppercase">
              Dev &amp; Tutorials
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/60">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Quick Search Link */}
          <Link
            href="/tutorials"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search guides...</span>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              /
            </kbd>
          </Link>

          {/* YouTube Channel Button */}
          <a
            href="https://youtube.com/@kartikdev"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-semibold transition-all hover:scale-102"
          >
            <YouTubeIcon className="w-4 h-4" />
            <span>YouTube</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>

          {/* Admin Portal Shortcut */}
          <Link
            href="/admin"
            className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
            title="Admin Dashboard"
          >
            <Shield className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/tutorials"
            className="p-2 text-slate-400 hover:text-white"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-3">
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
            <a
              href="https://youtube.com/@kartikdev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600/10 border border-red-500/30 text-red-400 text-xs font-semibold"
            >
              <YouTubeIcon className="w-4 h-4" />
              <span>Subscribe on YouTube</span>
            </a>

            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300"
            >
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Admin</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
