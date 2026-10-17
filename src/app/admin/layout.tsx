'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { isUserAdminOrOwner } from '@/lib/auth-helpers';
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  FolderGit2,
  Tag,
  MessageSquare,
  Mail,
  Users,
  Settings,
  LogOut,
  ExternalLink,
  Shield,
  ShieldCheck,
  Loader2,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    checkAdmin();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        window.location.href = '/admin/login';
      } else {
        checkAdmin();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname]);

  const checkAdmin = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = '/admin/login';
        return;
      }

      // Check if user is pre-authorized admin/owner
      if (isUserAdminOrOwner(session.user.email)) {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Verify admin/owner role in public.profiles table
      const { data: profileRecord } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileRecord?.role === 'admin' || profileRecord?.role === 'owner') {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Fallback check on admin_users table
      const { data: legacyAdmin } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (legacyAdmin) {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Unauthenticated / non-admin user redirected safely to their user profile
      window.location.href = '/profile';
    } catch (err) {
      console.error('Admin check error:', err);
      window.location.href = '/profile';
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4 text-slate-600">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-mono">Verifying administrative security credentials...</p>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard Overview', icon: LayoutDashboard },
    { href: '/admin/verification', label: 'Verification Center', icon: ShieldCheck },
    { href: '/admin/tutorials', label: 'All Tutorials', icon: BookOpen },
    { href: '/admin/tutorials/new', label: 'New Tutorial', icon: PlusCircle },
    { href: '/admin/projects', label: 'Projects', icon: FolderGit2 },
    { href: '/admin/categories', label: 'Categories & Tags', icon: Tag },
    { href: '/admin/comments', label: 'Comments Queue', icon: MessageSquare },
    { href: '/admin/messages', label: 'Contact Messages', icon: Mail },
    { href: '/admin/subscribers', label: 'Subscribers', icon: Users },
    { href: '/admin/settings', label: 'Profile & Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          <span className="font-bold text-slate-900 text-sm">Admin Control Panel</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Admin Sidebar */}
      <aside
        className={cn(
          'w-64 bg-white border-r border-slate-200 p-5 flex flex-col justify-between shrink-0 shadow-2xs',
          'fixed inset-y-0 left-0 z-50 md:static md:translate-x-0 transition-transform duration-200',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-2xs">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-sm block">Admin Portal</span>
                <span className="text-[10px] text-indigo-600 font-mono font-semibold">SUPABASE VERIFIED</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-medium"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Website</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Live
            </span>
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl overflow-y-auto bg-slate-50">
        {children}
      </main>
    </div>
  );
}
