'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { MarkdownRenderer } from '@/components/public/MarkdownRenderer';
import { YouTubeEmbed } from '@/components/ui/YouTubeEmbed';
import { slugify } from '@/lib/utils/slugify';
import { calculateReadingTime } from '@/lib/utils/reading-time';
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/utils/youtube';
import {
  ArrowLeft,
  Save,
  Eye,
  Edit3,
  Plus,
  Trash2,
  FileCode,
  Download,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export default function EditTutorialPage() {
  const router = useRouter();
  const params = useParams();
  const tutorialId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);

  // Main Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [prerequisites, setPrerequisites] = useState('');
  const [readingTime, setReadingTime] = useState(8);
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  // SEO
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Code Snippets
  const [snippets, setSnippets] = useState<
    Array<{ id?: string; title: string; language: string; code: string; explanation: string }>
  >([]);

  // Resources
  const [resources, setResources] = useState<
    Array<{ id?: string; title: string; file_url: string; resource_type: string }>
  >([]);

  // UI state
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (tutorialId) {
      loadData();
    }
  }, [tutorialId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load Categories
      const { data: catData } = await supabase.from('categories').select('*').order('name');
      setCategories(catData || []);

      // Load Tutorial
      const { data: tut, error: tutErr } = await supabase
        .from('tutorials')
        .select('*')
        .eq('id', tutorialId)
        .single();

      if (tutErr) throw tutErr;

      setTitle(tut.title);
      setSlug(tut.slug);
      setDescription(tut.description || '');
      setContent(tut.content || '');
      setYoutubeUrl(tut.youtube_url || '');
      setThumbnailUrl(tut.thumbnail_url || '');
      setCategoryId(tut.category_id || (catData?.[0]?.id ?? ''));
      setDifficulty(tut.difficulty || 'Beginner');
      setPrerequisites((tut.prerequisites || []).join(', '));
      setReadingTime(tut.reading_time || 8);
      setIsFeatured(tut.is_featured || false);
      setStatus(tut.status || 'draft');
      setSeoTitle(tut.seo_title || '');
      setSeoDescription(tut.seo_description || '');

      // Load Snippets
      const { data: snipData } = await supabase
        .from('code_snippets')
        .select('*')
        .eq('tutorial_id', tutorialId)
        .order('sort_order', { ascending: true });

      setSnippets(snipData || []);

      // Load Resources
      const { data: resData } = await supabase
        .from('tutorial_resources')
        .select('*')
        .eq('tutorial_id', tutorialId);

      setResources(resData || []);
    } catch (err: any) {
      console.error('Error loading tutorial:', err);
      setErrorMsg(err.message || 'Failed to load tutorial data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !slug.trim() || !content.trim()) {
      setErrorMsg('Title, slug, and content are required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const prereqArray = prerequisites
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const { error: tutErr } = await supabase
        .from('tutorials')
        .update({
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          content: content.trim(),
          youtube_url: youtubeUrl.trim() || null,
          thumbnail_url: thumbnailUrl.trim() || null,
          category_id: categoryId || null,
          difficulty,
          prerequisites: prereqArray,
          reading_time: readingTime,
          seo_title: seoTitle.trim() || title.trim(),
          seo_description: seoDescription.trim() || description.trim() || null,
          is_featured: isFeatured,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tutorialId);

      if (tutErr) throw tutErr;

      // Sync Snippets: Delete existing and re-insert
      await supabase.from('code_snippets').delete().eq('tutorial_id', tutorialId);
      const validSnippets = snippets.filter((s) => s.code.trim().length > 0);
      if (validSnippets.length > 0) {
        const snippetRecords = validSnippets.map((s, idx) => ({
          tutorial_id: tutorialId,
          title: s.title.trim() || null,
          language: s.language,
          code: s.code,
          explanation: s.explanation.trim() || null,
          sort_order: idx + 1,
        }));
        await supabase.from('code_snippets').insert(snippetRecords);
      }

      // Sync Resources
      await supabase.from('tutorial_resources').delete().eq('tutorial_id', tutorialId);
      const validResources = resources.filter((r) => r.file_url.trim().length > 0);
      if (validResources.length > 0) {
        const resourceRecords = validResources.map((r) => ({
          tutorial_id: tutorialId,
          title: r.title.trim() || 'Resource Asset',
          file_url: r.file_url.trim(),
          resource_type: r.resource_type,
        }));
        await supabase.from('tutorial_resources').insert(resourceRecords);
      }

      router.push('/admin/tutorials');
    } catch (err: any) {
      console.error('Update error:', err);
      setErrorMsg(err.message || 'Failed to update tutorial.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-500 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-mono">Loading tutorial data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <Link
          href="/admin/tutorials"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tutorials</span>
        </Link>

        <div className="flex items-center gap-3">
          {status === 'published' && (
            <Link
              href={`/tutorials/${slug}`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors"
            >
              <span>View Public Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'edit' ? 'preview' : 'edit')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors border border-slate-200"
          >
            {activeTab === 'edit' ? (
              <>
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>Preview</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Edit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {activeTab === 'preview' ? (
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-slate-900">{title}</h1>
            <p className="text-slate-600 text-sm">{description}</p>
          </div>
          {youtubeUrl && (
            <div className="max-w-2xl">
              <YouTubeEmbed urlOrId={youtubeUrl} title={title} />
            </div>
          )}
          <div className="pt-6 border-t border-slate-200">
            <MarkdownRenderer content={content} />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          {/* General info */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-900">General Information</h2>

            <Input
              label="Tutorial Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="SEO Slug *"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Textarea
              label="Short Description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>

              <Input
                label="Reading Time (Minutes)"
                type="number"
                min={1}
                value={readingTime}
                onChange={(e) => setReadingTime(parseInt(e.target.value) || 5)}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Publication Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="draft">Draft (Private)</option>
                  <option value="published">Published (Public)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isFeatured" className="text-xs text-slate-700 font-medium">
                Feature on homepage banner
              </label>
            </div>
          </div>

          {/* Media */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Media Assets</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="YouTube Video URL"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
              />
              <Input
                label="Thumbnail URL"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Tutorial Documentation (Markdown) *</h2>
            <Textarea
              rows={16}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="font-mono text-xs"
              required
            />
          </div>

          {/* Action */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
            <Link href="/admin/tutorials">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" isLoading={submitting} leftIcon={<Save className="w-4 h-4" />}>
              Save Changes
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
