'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Tutorial } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils/reading-time';
import {
  BookOpen,
  PlusCircle,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  AlertCircle,
} from 'lucide-react';

export default function AdminTutorialsPage() {
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tutorials')
        .select(`
          id,
          title,
          slug,
          status,
          difficulty,
          reading_time,
          thumbnail_url,
          youtube_url,
          is_featured,
          published_at,
          created_at,
          category:categories(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTutorials(data || []);
    } catch (err) {
      console.error('Error fetching tutorials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (tutorial: any) => {
    const newStatus = tutorial.status === 'published' ? 'draft' : 'published';
    const publishedAt = newStatus === 'published' ? new Date().toISOString() : null;

    try {
      const { error } = await supabase
        .from('tutorials')
        .update({
          status: newStatus,
          published_at: publishedAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tutorial.id);

      if (error) throw error;

      setTutorials((prev) =>
        prev.map((t) =>
          t.id === tutorial.id ? { ...t, status: newStatus, published_at: publishedAt } : t
        )
      );
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      const { error } = await supabase.from('tutorials').delete().eq('id', id);
      if (error) throw error;

      setTutorials((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTutorials = tutorials.filter((tut) => {
    const matchesSearch =
      tut.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tut.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tut.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Tutorial Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create, edit, publish, and curate tutorials with embedded YouTube walk-throughs.
          </p>
        </div>

        <Link href="/admin/tutorials/new">
          <Button size="md" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
            New Tutorial
          </Button>
        </Link>
      </div>

      {/* Toolbar Search & Status Filter */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tutorials by title..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            All ({tutorials.length})
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              statusFilter === 'published'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Published ({tutorials.filter((t) => t.status === 'published').length})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              statusFilter === 'draft'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Drafts ({tutorials.filter((t) => t.status === 'draft').length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Tutorial</th>
                <th className="p-4">Category</th>
                <th className="p-4">Difficulty</th>
                <th className="p-4">Status</th>
                <th className="p-4">Published</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading tutorials...
                  </td>
                </tr>
              ) : filteredTutorials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No tutorials match your criteria.
                  </td>
                </tr>
              ) : (
                filteredTutorials.map((tut) => (
                  <tr key={tut.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Thumbnail & Title */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={tut.thumbnail_url || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=200'}
                          alt={tut.title}
                          className="w-14 h-9 rounded-lg object-cover bg-slate-800 shrink-0"
                        />
                        <div className="space-y-0.5">
                          <span className="font-semibold text-white line-clamp-1 max-w-sm">
                            {tut.title}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 block truncate max-w-xs">
                            /tutorials/{tut.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4 text-slate-300">
                      {tut.category?.name || 'Uncategorized'}
                    </td>

                    {/* Difficulty */}
                    <td className="p-4">
                      <Badge variant="outline" size="sm">
                        {tut.difficulty}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <Badge
                        variant={tut.status === 'published' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {tut.status}
                      </Badge>
                    </td>

                    {/* Published Date */}
                    <td className="p-4 text-slate-400">
                      {formatDate(tut.published_at || tut.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Live Link */}
                        {tut.status === 'published' && (
                          <Link
                            href={`/tutorials/${tut.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            title="View Public Tutorial"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}

                        {/* Status Toggle Button */}
                        <button
                          onClick={() => handleTogglePublish(tut)}
                          className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                            tut.status === 'published'
                              ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                          title={tut.status === 'published' ? 'Unpublish to draft' : 'Publish to live website'}
                        >
                          {tut.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>

                        {/* Edit Link */}
                        <Link
                          href={`/admin/tutorials/${tut.id}/edit`}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300"
                          title="Edit Tutorial"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(tut.id, tut.title)}
                          disabled={deletingId === tut.id}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Delete Tutorial"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
