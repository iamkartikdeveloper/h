'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
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
  Loader2,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
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

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.push('/admin/login');
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
        router.push('/admin/login');
        return;
      }

      // Verify admin role in admin_users
      const { data: adminRecord, error } = await supabase
        .from('admin_users')
        .select('id, role')
        .eq('user_id', session.user.id)
        .single();

      if (error || !adminRecord) {
        console.warn('User authenticated but not registered in admin_users');
        router.push('/admin/login');
        return;
      }

      setIsAdmin(true);
    } catch (err) {
      console.error('Admin check error:', err);
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center space-y-4 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs font-mono">Verifying administrative security credentials...</p>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard Overview', icon: LayoutDashboard },
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
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-white text-sm">Admin Control Panel</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Admin Sidebar */}
      <aside
        className={cn(
          'w-64 bg-slate-950 border-r border-slate-800/80 p-5 flex flex-col justify-between shrink-0',
          'fixed inset-y-0 left-0 z-50 md:static md:translate-x-0 transition-transform duration-200',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white text-sm block">Admin Portal</span>
                <span className="text-[10px] text-indigo-400 font-mono">SUPABASE VERIFIED</span>
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
                    'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
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
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Website</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
              Live
            </span>
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
