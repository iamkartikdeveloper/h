'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';
import { MarkdownRenderer } from '@/components/public/MarkdownRenderer';
import { YouTubeEmbed } from '@/components/ui/YouTubeEmbed';
import { slugify } from '@/lib/utils/slugify';
import { normalizeMarkdown } from '@/lib/utils/markdown';
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
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { YouTubeIcon } from '@/components/ui/Icons';

export default function NewTutorialPage() {
  const router = useRouter();

  // Categories
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
  const [isVerified, setIsVerified] = useState(true);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  // SEO Fields
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Code Snippets
  const [snippets, setSnippets] = useState<
    Array<{ title: string; language: string; code: string; explanation: string }>
  >([]);

  // Resources
  const [resources, setResources] = useState<
    Array<{ title: string; file_url: string; resource_type: string }>
  >([]);

  // UI state
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data && data.length > 0) {
      setCategories(data);
      setCategoryId(data[0].id);
    }
  };

  // Auto-slugify on title change if slug hasn't been manually locked
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setSlug(slugify(newTitle));
    if (!seoTitle) setSeoTitle(newTitle);
  };

  // Content change auto-calculates reading time
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setReadingTime(calculateReadingTime(newContent));
  };

  // YouTube URL change auto-extracts thumbnail if thumbnail is empty
  const handleYouTubeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setYoutubeUrl(url);
    const videoId = extractYouTubeId(url);
    if (videoId && !thumbnailUrl) {
      setThumbnailUrl(getYouTubeThumbnail(videoId));
    }
  };

  // Add Snippet
  const addSnippet = () => {
    setSnippets((prev) => [
      ...prev,
      { title: '', language: 'kotlin', code: '', explanation: '' },
    ]);
  };

  const updateSnippet = (index: number, field: string, value: string) => {
    setSnippets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const removeSnippet = (index: number) => {
    setSnippets((prev) => prev.filter((_, i) => i !== index));
  };

  // Add Resource
  const addResource = () => {
    setResources((prev) => [
      ...prev,
      { title: '', file_url: '', resource_type: 'zip' },
    ]);
  };

  const updateResource = (index: number, field: string, value: string) => {
    setResources((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const removeResource = (index: number) => {
    setResources((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMsg('Please enter a tutorial title.');
      return;
    }
    if (!slug.trim()) {
      setErrorMsg('Please enter an SEO slug.');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('Tutorial content cannot be empty.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      // Check for duplicate slug
      const { data: existingSlug } = await supabase
        .from('tutorials')
        .select('id')
        .eq('slug', slug.trim())
        .maybeSingle();

      if (existingSlug) {
        setErrorMsg(`The slug "${slug}" is already in use. Please modify it.`);
        setSubmitting(false);
        return;
      }

      const prereqArray = prerequisites
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const publishedAt = status === 'published' ? new Date().toISOString() : null;

      // 1. Insert tutorial
      const { data: newTutorial, error: tutErr } = await supabase
        .from('tutorials')
        .insert([
          {
            title: title.trim(),
            slug: slug.trim(),
            description: description.trim() || null,
            content: normalizeMarkdown(content.trim()),
            youtube_url: youtubeUrl.trim() || null,
            thumbnail_url: thumbnailUrl.trim() || null,
            category_id: categoryId || null,
            difficulty,
            prerequisites: prereqArray,
            reading_time: readingTime,
            seo_title: seoTitle.trim() || title.trim(),
            seo_description: seoDescription.trim() || description.trim() || null,
            is_featured: isFeatured,
            is_verified: isVerified,
            status,
            published_at: publishedAt,
          },
        ])
        .select('id')
        .single();

      if (tutErr) throw tutErr;

      const tutorialId = newTutorial.id;

      // 2. Insert snippets if any
      const validSnippets = snippets.filter((s) => s.code.trim().length > 0);
      if (validSnippets.length > 0) {
        const snippetRecords = validSnippets.map((s, index) => ({
          tutorial_id: tutorialId,
          title: s.title.trim() || null,
          language: s.language,
          code: s.code,
          explanation: s.explanation.trim() || null,
          sort_order: index + 1,
        }));
        await supabase.from('code_snippets').insert(snippetRecords);
      }

      // 3. Insert resources if any
      const validResources = resources.filter((r) => r.file_url.trim().length > 0);
      if (validResources.length > 0) {
        const resourceRecords = validResources.map((r) => ({
          tutorial_id: tutorialId,
          title: r.title.trim() || 'Download Asset',
          file_url: r.file_url.trim(),
          resource_type: r.resource_type,
        }));
        await supabase.from('tutorial_resources').insert(resourceRecords);
      }

      router.push('/admin/tutorials');
    } catch (err: any) {
      console.error('Error creating tutorial:', err);
      setErrorMsg(err.message || 'Failed to save tutorial.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <Link
          href="/admin/tutorials"
          className="inline-flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tutorials</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'edit' ? 'preview' : 'edit')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 transition-colors cursor-pointer"
          >
            {activeTab === 'edit' ? (
              <>
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>Live Preview</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Return to Editor</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {activeTab === 'preview' ? (
        /* Preview Mode */
        <div className="p-8 rounded-3xl bg-white border border-slate-200 space-y-8 shadow-xs">
          <div className="space-y-3">
            <span className="text-xs uppercase font-mono tracking-widest text-indigo-600 font-bold">
              Preview Mode
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900">{title || 'Untitled Tutorial'}</h1>
            <p className="text-slate-600 text-sm">{description}</p>
          </div>

          {youtubeUrl && (
            <div className="max-w-2xl">
              <YouTubeEmbed urlOrId={youtubeUrl} title={title} />
            </div>
          )}

          <div className="pt-6 border-t border-slate-100">
            <MarkdownRenderer content={content} />
          </div>
        </div>
      ) : (
        /* Edit Mode Form */
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Main Info Box */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-5">
            <h2 className="text-base font-bold text-slate-900">General Information</h2>

            <Input
              label="Tutorial Title *"
              placeholder="e.g. How to Implement Google AdMob in Android (Kotlin Guide)"
              value={title}
              onChange={handleTitleChange}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="SEO Slug *"
                placeholder="e.g. how-to-implement-google-admob-in-android"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                helperText="Appears in URL: /tutorials/your-slug"
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-600 shadow-2xs"
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
              placeholder="Brief summary of the tutorial for cards and SEO meta description..."
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (!seoDescription) setSeoDescription(e.target.value);
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-600 shadow-2xs"
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
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-600 shadow-2xs"
                >
                  <option value="draft">Draft (Private)</option>
                  <option value="published">Published (Public)</option>
                </select>
              </div>
            </div>

            <Input
              label="Prerequisites (Comma separated)"
              placeholder="Android Studio, Kotlin Coroutines, Gradle 8.0"
              value={prerequisites}
              onChange={(e) => setPrerequisites(e.target.value)}
            />

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

          {/* Media & YouTube Section */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <YouTubeIcon className="w-4 h-4 text-red-600" />
              <span>Video &amp; Media Assets</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="YouTube Video URL or Video ID"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={handleYouTubeChange}
                helperText="Paste any standard YouTube watch link, youtu.be, or video ID"
              />

              <Input
                label="Thumbnail Image URL"
                placeholder="https://images.unsplash.com/... or auto-fetched from YouTube"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
              />
            </div>
          </div>

          {/* Markdown Content Editor */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <MarkdownEditor
              value={content}
              onChange={setContent}
              label="Tutorial Documentation (Markdown) *"
              required
            />
          </div>

          {/* Quality & Verification Assurance */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Verification System &amp; Quality Badge</span>
            </h2>
            <p className="text-xs text-slate-500">
              Mark this tutorial as verified to give developers and students full confidence that the instructions and code have been tested and confirmed working.
            </p>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-emerald-950 block">
                  Verified &amp; Tested Tutorial
                </span>
                <span className="text-[11px] text-emerald-700 block">
                  Displays official "✓ Verified &amp; Tested - Confirmed Working" badge on the tutorial page.
                </span>
              </div>
              <input
                type="checkbox"
                id="isVerified"
                checked={isVerified}
                onChange={(e) => setIsVerified(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Code Snippets Builder */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-600" />
                  <span>Dedicated Code Snippets (Optional)</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Add organized standalone code files with custom titles and explanations.
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addSnippet} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Snippet
              </Button>
            </div>

            <div className="space-y-4">
              {snippets.map((snip, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Input
                      placeholder="Snippet Title (e.g. MainActivity.kt)"
                      value={snip.title}
                      onChange={(e) => updateSnippet(idx, 'title', e.target.value)}
                      className="text-xs py-1.5"
                    />
                    <select
                      value={snip.language}
                      onChange={(e) => updateSnippet(idx, 'language', e.target.value)}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none shadow-2xs"
                    >
                      <option value="kotlin">Kotlin</option>
                      <option value="dart">Dart</option>
                      <option value="java">Java</option>
                      <option value="xml">XML</option>
                      <option value="typescript">TypeScript</option>
                      <option value="javascript">JavaScript</option>
                      <option value="bash">Bash / Terminal</option>
                      <option value="sql">SQL</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeSnippet(idx)}
                      className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <Textarea
                    placeholder="Paste full code here..."
                    rows={6}
                    value={snip.code}
                    onChange={(e) => updateSnippet(idx, 'code', e.target.value)}
                    className="font-mono text-xs"
                  />
                  <Input
                    placeholder="Short explanation / note for this snippet..."
                    value={snip.explanation}
                    onChange={(e) => updateSnippet(idx, 'explanation', e.target.value)}
                    className="text-xs py-1.5"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Downloadable Resources Builder */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Downloadable Resources &amp; Repositories</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Provide links to starter ZIP files, GitHub repos, or PDF cheatsheets.
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addResource} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Resource
              </Button>
            </div>

            <div className="space-y-3">
              {resources.map((res, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <Input
                    placeholder="Resource Label (e.g. Starter Project ZIP)"
                    value={res.title}
                    onChange={(e) => updateResource(idx, 'title', e.target.value)}
                    className="text-xs py-1.5"
                  />
                  <Input
                    placeholder="https://github.com/... or file URL"
                    value={res.file_url}
                    onChange={(e) => updateResource(idx, 'file_url', e.target.value)}
                    className="text-xs py-1.5"
                  />
                  <select
                    value={res.resource_type}
                    onChange={(e) => updateResource(idx, 'resource_type', e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 outline-none shadow-2xs"
                  >
                    <option value="zip">ZIP</option>
                    <option value="github">GitHub</option>
                    <option value="pdf">PDF</option>
                    <option value="link">Link</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeResource(idx)}
                    className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
            <Link href="/admin/tutorials">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" isLoading={submitting} leftIcon={<Save className="w-4 h-4" />}>
              {status === 'published' ? 'Publish Tutorial' : 'Save as Draft'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
