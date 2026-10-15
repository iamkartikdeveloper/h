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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tutorial Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
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
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tutorials by title..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-600 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All ({tutorials.length})
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
              statusFilter === 'published'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Published ({tutorials.filter((t) => t.status === 'published').length})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
              statusFilter === 'draft'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Drafts ({tutorials.filter((t) => t.status === 'draft').length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Tutorial</th>
                <th className="p-4">Category</th>
                <th className="p-4">Difficulty</th>
                <th className="p-4">Status</th>
                <th className="p-4">Published</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Loading tutorials...
                  </td>
                </tr>
              ) : filteredTutorials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No tutorials match your criteria.
                  </td>
                </tr>
              ) : (
                filteredTutorials.map((tut) => (
                  <tr key={tut.id} className="hover:bg-slate-50 transition-colors">
                    {/* Thumbnail & Title */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={tut.thumbnail_url || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=200'}
                          alt={tut.title}
                          className="w-14 h-9 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                        />
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 line-clamp-1 max-w-sm">
                            {tut.title}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 block truncate max-w-xs">
                            /tutorials/{tut.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4 text-slate-700 font-medium">
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
                    <td className="p-4 text-slate-500">
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
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                            title="View Public Tutorial"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}

                        {/* Status Toggle Button */}
                        <button
                          onClick={() => handleTogglePublish(tut)}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                            tut.status === 'published'
                              ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200'
                          }`}
                          title={tut.status === 'published' ? 'Unpublish to draft' : 'Publish to live website'}
                        >
                          {tut.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>

                        {/* Edit Link */}
                        <Link
                          href={`/admin/tutorials/${tut.id}/edit`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-indigo-700 border border-slate-200"
                          title="Edit Tutorial"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(tut.id, tut.title)}
                          disabled={deletingId === tut.id}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
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
