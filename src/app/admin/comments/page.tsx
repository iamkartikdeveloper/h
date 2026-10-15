'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils/reading-time';
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  ExternalLink,
} from 'lucide-react';

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  useEffect(() => {
    fetchComments();
  }, [statusFilter]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('comments')
        .select(`
          id,
          author_name,
          author_email,
          content,
          status,
          created_at,
          tutorial:tutorials(id, title, slug)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
    } catch (err: any) {
      alert(`Update error: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this comment permanently?')) return;

    try {
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) throw error;
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Comment Moderation Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Review community questions and discussions before they appear live on tutorials.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 text-xs">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl font-medium uppercase tracking-wider text-[11px] transition-colors cursor-pointer ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-500 text-xs">
            No comments in "{statusFilter}" state.
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-500 font-bold text-white flex items-center justify-center text-xs shadow-sm">
                    {comment.author_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">
                      {comment.author_name}
                    </span>
                    <span className="text-slate-500 text-[11px]">{comment.author_email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      comment.status === 'approved'
                        ? 'success'
                        : comment.status === 'pending'
                        ? 'warning'
                        : 'danger'
                    }
                    size="sm"
                  >
                    {comment.status}
                  </Badge>
                  <span className="text-slate-500 text-[11px] font-mono">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
              </div>

              {/* Tutorial reference */}
              {comment.tutorial && (
                <div className="text-xs text-indigo-600 flex items-center gap-1.5 font-medium">
                  <span className="text-slate-500">On Tutorial:</span>
                  <Link
                    href={`/tutorials/${comment.tutorial.slug}`}
                    target="_blank"
                    className="hover:underline flex items-center gap-1"
                  >
                    <span>{comment.tutorial.title}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}

              {/* Comment text */}
              <p className="text-sm text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
                {comment.content}
              </p>

              {/* Moderation Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 text-xs">
                {comment.status !== 'approved' && (
                  <button
                    onClick={() => handleUpdateStatus(comment.id, 'approved')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                )}

                {comment.status !== 'rejected' && (
                  <button
                    onClick={() => handleUpdateStatus(comment.id, 'rejected')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors font-medium"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}

                <button
                  onClick={() => handleDelete(comment.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
