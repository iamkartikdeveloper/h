'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils/reading-time';
import {
  BookOpen,
  FolderGit2,
  Mail,
  Users,
  MessageSquare,
  PlusCircle,
  TrendingUp,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalTutorials: 0,
    publishedTutorials: 0,
    draftTutorials: 0,
    totalProjects: 0,
    unreadMessages: 0,
    pendingComments: 0,
    totalSubscribers: 0,
  });

  const [recentTutorials, setRecentTutorials] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch tutorials counts
      const { data: allTutorials } = await supabase
        .from('tutorials')
        .select('id, title, slug, status, published_at, created_at, difficulty')
        .order('created_at', { ascending: false });

      const totalTutorials = allTutorials?.length || 0;
      const publishedTutorials = allTutorials?.filter((t) => t.status === 'published').length || 0;
      const draftTutorials = allTutorials?.filter((t) => t.status === 'draft').length || 0;

      // Fetch projects count
      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      // Fetch unread messages count
      const { data: unreadMsgData } = await supabase
        .from('contact_messages')
        .select('id, name, email, subject, created_at, status')
        .eq('status', 'unread')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch pending comments count
      const { count: pendingCommCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch subscribers count
      const { count: subCount } = await supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setStats({
        totalTutorials,
        publishedTutorials,
        draftTutorials,
        totalProjects: projectCount || 0,
        unreadMessages: unreadMsgData?.length || 0,
        pendingComments: pendingCommCount || 0,
        totalSubscribers: subCount || 0,
      });

      setRecentTutorials((allTutorials || []).slice(0, 5));
      setRecentMessages(unreadMsgData || []);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time analytics and management for your portfolio and tutorial platform.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/tutorials/new">
            <Button size="sm" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Create Tutorial
            </Button>
          </Link>
          <Link href="/admin/projects">
            <Button size="sm" variant="secondary" leftIcon={<FolderGit2 className="w-4 h-4" />}>
              Projects
            </Button>
          </Link>
        </div>
      </div>

      {/* Real Statistics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Tutorials */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Tutorials</span>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {stats.totalTutorials}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="text-emerald-400 font-medium">{stats.publishedTutorials} Published</span>
            <span>•</span>
            <span className="text-amber-400 font-medium">{stats.draftTutorials} Drafts</span>
          </div>
        </div>

        {/* Total Projects */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Portfolio Projects</span>
            <FolderGit2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {stats.totalProjects}
          </div>
          <p className="text-[11px] text-slate-400">Active portfolio showcase items</p>
        </div>

        {/* Contact Messages */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Unread Inquiries</span>
            <Mail className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {stats.unreadMessages}
          </div>
          <p className="text-[11px] text-slate-400">
            {stats.unreadMessages > 0 ? (
              <span className="text-rose-400 font-medium">Needs response</span>
            ) : (
              <span className="text-emerald-400">All caught up</span>
            )}
          </p>
        </div>

        {/* Newsletter Subscribers */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Subscribers</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {stats.totalSubscribers}
          </div>
          <p className="text-[11px] text-slate-400">Verified newsletter audience</p>
        </div>
      </div>

      {/* Moderation Alert Banner if comments are pending */}
      {stats.pendingComments > 0 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              You have <strong>{stats.pendingComments}</strong> community comment(s) waiting for moderation.
            </span>
          </div>
          <Link
            href="/admin/comments"
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold transition-colors"
          >
            Review Queue
          </Link>
        </div>
      )}

      {/* 2-Column Tables: Recent Tutorials & Unread Inquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Tutorials */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Recent Content Updates</span>
            </h2>
            <Link
              href="/admin/tutorials"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              Manage all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden divide-y divide-slate-800/80">
            {recentTutorials.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No tutorials found in database. Create your first one!
              </div>
            ) : (
              recentTutorials.map((tut) => (
                <div
                  key={tut.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                >
                  <div className="space-y-1 pr-4">
                    <h3 className="text-xs font-semibold text-white line-clamp-1">{tut.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{formatDate(tut.published_at || tut.created_at)}</span>
                      <span>•</span>
                      <span>{tut.difficulty}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={tut.status === 'published' ? 'success' : 'warning'}
                      size="sm"
                    >
                      {tut.status}
                    </Badge>
                    <Link
                      href={`/admin/tutorials/${tut.id}/edit`}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-rose-400" />
              <span>Incoming Messages</span>
            </h2>
            <Link
              href="/admin/messages"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden divide-y divide-slate-800/80">
            {recentMessages.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No unread messages.
              </div>
            ) : (
              recentMessages.map((msg) => (
                <div key={msg.id} className="p-4 space-y-1 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{msg.name}</span>
                    <span className="text-[10px] text-slate-400">{formatDate(msg.created_at)}</span>
                  </div>
                  <p className="text-xs text-indigo-300 font-medium line-clamp-1">{msg.subject}</p>
                  <p className="text-[11px] text-slate-400">{msg.email}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
