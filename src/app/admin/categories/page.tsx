'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Category, Tag } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { slugify } from '@/lib/utils/slugify';
import { Tag as TagIcon, Plus, Trash2, Layers, AlertCircle } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // New Category
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // New Tag
  const [tagName, setTagName] = useState('');
  const [tagSlug, setTagSlug] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [{ data: cats }, { data: tgs }] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('tags').select('*').order('name'),
      ]);
      setCategories(cats || []);
      setTags(tgs || []);
    } catch (err) {
      console.error('Error fetching categories & tags:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catSlug.trim()) return;

    try {
      setErrorMsg(null);
      const { data, error } = await supabase
        .from('categories')
        .insert([
          {
            name: catName.trim(),
            slug: catSlug.trim(),
            description: catDesc.trim() || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setCategories([...categories, data]);
      setCatName('');
      setCatSlug('');
      setCatDesc('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create category.');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"? Tutorials in this category will become uncategorized.`)) return;

    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim() || !tagSlug.trim()) return;

    try {
      setErrorMsg(null);
      const { data, error } = await supabase
        .from('tags')
        .insert([
          {
            name: tagName.trim(),
            slug: tagSlug.trim(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setTags([...tags, data]);
      setTagName('');
      setTagSlug('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create tag.');
    }
  };

  const handleDeleteTag = async (id: string, name: string) => {
    if (!window.confirm(`Delete tag "${name}"?`)) return;

    try {
      const { error } = await supabase.from('tags').delete().eq('id', id);
      if (error) throw error;
      setTags((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Categories &amp; Tags
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Organize tutorials into searchable programming topics, languages, and frameworks.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2-Column: Categories on left, Tags on right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Categories Section */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Create Category</span>
            </h2>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <Input
                placeholder="Category Name (e.g. Android Development)"
                value={catName}
                onChange={(e) => {
                  setCatName(e.target.value);
                  setCatSlug(slugify(e.target.value));
                }}
                required
              />
              <Input
                placeholder="Category Slug (e.g. android-development)"
                value={catSlug}
                onChange={(e) => setCatSlug(slugify(e.target.value))}
                required
              />
              <Input
                placeholder="Short Description..."
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
              />
              <Button type="submit" size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                Add Category
              </Button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden divide-y divide-slate-800/80">
            {categories.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div>
                  <h4 className="text-xs font-semibold text-white">{c.name}</h4>
                  <p className="text-[10px] text-slate-500 font-mono">/tutorials?category={c.slug}</p>
                </div>
                <button
                  onClick={() => handleDeleteCategory(c.id, c.name)}
                  className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tags Section */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TagIcon className="w-4 h-4 text-sky-400" />
              <span>Create Tag</span>
            </h2>

            <form onSubmit={handleCreateTag} className="space-y-3">
              <Input
                placeholder="Tag Name (e.g. Kotlin)"
                value={tagName}
                onChange={(e) => {
                  setTagName(e.target.value);
                  setTagSlug(slugify(e.target.value));
                }}
                required
              />
              <Input
                placeholder="Tag Slug (e.g. kotlin)"
                value={tagSlug}
                onChange={(e) => setTagSlug(slugify(e.target.value))}
                required
              />
              <Button type="submit" size="sm" variant="secondary" leftIcon={<Plus className="w-4 h-4" />}>
                Add Tag
              </Button>
            </form>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Tags ({tags.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <div
                  key={t.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-200"
                >
                  <span>#{t.name}</span>
                  <button
                    onClick={() => handleDeleteTag(t.id, t.name)}
                    className="text-slate-400 hover:text-rose-400 transition-colors ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
