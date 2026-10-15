import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import { YouTubeEmbed } from '@/components/ui/YouTubeEmbed';
import { MarkdownRenderer } from '@/components/public/MarkdownRenderer';
import { TableOfContents } from '@/components/public/TableOfContents';
import { FeedbackVote } from '@/components/public/FeedbackVote';
import { CommentSection } from '@/components/public/CommentSection';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Badge } from '@/components/ui/Badge';
import { extractTableOfContents } from '@/lib/utils/markdown';
import { formatDate } from '@/lib/utils/reading-time';
import {
  ChevronRight,
  Clock,
  Calendar,
  Share2,
  FolderGit2,
  Download,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  ArrowLeft,
  FileCode,
  Tag as TagIcon,
  HelpCircle,
} from 'lucide-react';

interface TutorialPageProps {
  params: Promise<{ slug: string }>;
}

import { MOCK_TUTORIALS } from '@/lib/mock-data';

// Dynamic SEO metadata generation
export async function generateMetadata({ params }: TutorialPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServerClient();

  let tutorialData: any = null;
  try {
    const { data: tutorial } = await supabase
      .from('tutorials')
      .select('title, description, seo_title, seo_description, thumbnail_url, published_at')
      .eq('slug', slug)
      .single();
    tutorialData = tutorial;
  } catch {}

  if (!tutorialData) {
    tutorialData = MOCK_TUTORIALS.find((t) => t.slug === slug);
  }

  if (!tutorialData) {
    return {
      title: 'Tutorial Not Found',
    };
  }

  const title = tutorialData.seo_title || `${tutorialData.title} | Kartik Sharma`;
  const description = tutorialData.seo_description || tutorialData.description || '';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: tutorialData.published_at || undefined,
      images: [
        {
          url:
            tutorialData.thumbnail_url ||
            'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200',
          width: 1200,
          height: 630,
          alt: tutorialData.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [
        tutorialData.thumbnail_url ||
          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200',
      ],
    },
  };
}

export default async function TutorialDetailPage({ params }: TutorialPageProps) {
  const { slug } = await params;
  const supabase = createServerClient();

  let tutorial: any = null;
  try {
    const { data } = await supabase
      .from('tutorials')
      .select(`
        id,
        title,
        slug,
        description,
        content,
        youtube_url,
        thumbnail_url,
        category_id,
        difficulty,
        prerequisites,
        reading_time,
        is_featured,
        published_at,
        updated_at,
        category:categories(name, slug),
        code_snippets(*),
        resources:tutorial_resources(*)
      `)
      .eq('slug', slug)
      .single();
    tutorial = data;
  } catch {}

  if (!tutorial) {
    tutorial = MOCK_TUTORIALS.find((t) => t.slug === slug);
  }

  if (!tutorial) {
    notFound();
  }

  // Fetch related tutorials in the same category
  let related: any[] = [];
  try {
    const { data: relatedTutorials } = await supabase
      .from('tutorials')
      .select('id, title, slug, thumbnail_url, reading_time, difficulty')
      .eq('status', 'published')
      .neq('id', tutorial.id)
      .limit(3);
    related = relatedTutorials || [];
  } catch {}

  const relatedTutorials =
    related.length > 0
      ? related
      : MOCK_TUTORIALS.filter((t) => t.id !== tutorial.id).slice(0, 3);

  const tocItems = extractTableOfContents(tutorial.content);
  const categoryName = (tutorial.category as any)?.name || 'Development';
  const categorySlug = (tutorial.category as any)?.slug || 'all';

  // TechArticle structured data (JSON-LD) for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: tutorial.title,
    description: tutorial.description,
    image: [tutorial.thumbnail_url],
    datePublished: tutorial.published_at,
    dateModified: tutorial.updated_at,
    author: {
      '@type': 'Person',
      name: 'Kartik Sharma',
      url: 'https://kartikdev.vercel.app',
    },
    publisher: {
      '@type': 'Person',
      name: 'Kartik Sharma',
    },
    articleBody: tutorial.content,
  };

  return (
    <>
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-10">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-indigo-400 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/tutorials" className="hover:text-indigo-400 transition-colors">
            Tutorials
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link
            href={`/tutorials?category=${categorySlug}`}
            className="hover:text-indigo-400 transition-colors"
          >
            {categoryName}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-200 font-medium truncate max-w-xs">{tutorial.title}</span>
        </nav>

        {/* Tutorial Header */}
        <div className="space-y-4 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant="primary" size="md">
              {categoryName}
            </Badge>
            <Badge variant="outline" size="md">
              {tutorial.difficulty}
            </Badge>
            {tutorial.is_featured && (
              <Badge variant="gradient" size="md">
                Featured Guide
              </Badge>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {tutorial.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            {tutorial.description}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-500 border-b border-slate-200 pb-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-500 text-white font-bold flex items-center justify-center text-[10px]">
                K
              </div>
              <span className="font-semibold text-slate-800">Kartik Sharma</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Published {formatDate(tutorial.published_at)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{tutorial.reading_time || 8} min read</span>
            </div>
          </div>
        </div>

        {/* Responsive YouTube Video Player */}
        {tutorial.youtube_url && (
          <div className="max-w-4xl">
            <YouTubeEmbed urlOrId={tutorial.youtube_url} title={tutorial.title} />
          </div>
        )}

        {/* Main 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-12">
            {/* Prerequisites Section */}
            {tutorial.prerequisites && tutorial.prerequisites.length > 0 && (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Prerequisites &amp; Requirements</span>
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  {tutorial.prerequisites.map((req: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Step-by-Step Documentation Body */}
            <article className="space-y-6">
              <MarkdownRenderer content={tutorial.content} />
            </article>

            {/* Organized Code Snippets Section (if separate snippets exist) */}
            {tutorial.code_snippets && tutorial.code_snippets.length > 0 && (
              <div className="space-y-6 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-xl font-extrabold text-slate-900">Full Source Code Blocks</h3>
                </div>
                <div className="space-y-6">
                  {tutorial.code_snippets.map((snippet: any) => (
                    <CodeBlock
                      key={snippet.id}
                      title={snippet.title}
                      language={snippet.language}
                      code={snippet.code}
                      explanation={snippet.explanation}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Downloadable Resources & GitHub Repositories */}
            {tutorial.resources && tutorial.resources.length > 0 && (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Download Source Code &amp; Assets</h3>
                </div>
                <div className="space-y-2">
                  {tutorial.resources.map((res: any) => (
                    <a
                      key={res.id}
                      href={res.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <FolderGit2 className="w-4 h-4 text-indigo-600" />
                        <span>{res.title}</span>
                        <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-medium">
                          {res.resource_type}
                        </span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Helpfulness Feedback Vote */}
            <FeedbackVote tutorialId={tutorial.id} />

            {/* Community Moderated Comments */}
            <CommentSection tutorialId={tutorial.id} />
          </div>

          {/* Sticky Sidebar (Table of Contents & Related Guides) */}
          <div className="lg:col-span-4 space-y-8">
            {/* Table of Contents */}
            {tocItems.length > 0 && <TableOfContents items={tocItems} />}

            {/* Related Tutorials Widget */}
            {relatedTutorials && relatedTutorials.length > 0 && (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Related Tutorials
                </h4>
                <div className="space-y-3">
                  {relatedTutorials.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/tutorials/${rel.slug}`}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <img
                        src={rel.thumbnail_url || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=200'}
                        alt={rel.title}
                        className="w-16 h-12 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                      />
                      <div className="space-y-1 overflow-hidden">
                        <h5 className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {rel.title}
                        </h5>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {rel.reading_time || 8} min read
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
