import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';
import { MarkdownRenderer } from '@/components/public/MarkdownRenderer';
import {
  ChevronRight,
  ExternalLink,
  FolderGit2,
  Calendar,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { GitHubIcon } from '@/components/ui/Icons';
import { formatDate } from '@/lib/utils/reading-time';

import { MOCK_PROJECTS } from '@/lib/mock-data';

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServerClient();

  let projectData: any = null;
  try {
    const { data } = await supabase
      .from('projects')
      .select('title, description, thumbnail_url')
      .eq('slug', slug)
      .single();
    projectData = data;
  } catch {}

  if (!projectData) {
    projectData = MOCK_PROJECTS.find((p) => p.slug === slug);
  }

  if (!projectData) return { title: 'Project Not Found' };

  return {
    title: `${projectData.title} | Projects | Kartik Sharma`,
    description: projectData.description || '',
    openGraph: {
      title: projectData.title,
      description: projectData.description || '',
      images: [projectData.thumbnail_url || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200'],
    },
  };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const supabase = createServerClient();

  let project: any = null;
  try {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .single();
    project = data;
  } catch {}

  if (!project) {
    project = MOCK_PROJECTS.find((p) => p.slug === slug);
  }

  if (!project) notFound();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/projects" className="hover:text-indigo-600 transition-colors">
          Projects
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-semibold truncate max-w-xs">{project.title}</span>
      </nav>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {project.is_featured && (
            <Badge variant="gradient" size="md">
              Featured Case Study
            </Badge>
          )}
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Updated {formatDate(project.updated_at)}</span>
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
          {project.title}
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
          {project.description}
        </p>

        {/* Tech Stack tags */}
        <div className="flex flex-wrap gap-2 pt-2">
          {project.technologies?.map((tech: string, i: number) => (
            <Badge key={i} variant="secondary" size="md">
              {tech}
            </Badge>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-b border-slate-200 pb-8">
          {project.demo_url && (
            <a
              href={project.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors"
            >
              <span>Visit Live Demo</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-sm font-semibold transition-colors"
            >
              <GitHubIcon className="w-4 h-4" />
              <span>Browse Source Code</span>
            </a>
          )}
        </div>
      </div>

      {/* Hero Showcase Image */}
      {project.thumbnail_url && (
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-100">
          <img
            src={project.thumbnail_url}
            alt={project.title}
            className="w-full h-auto object-cover max-h-[500px]"
          />
        </div>
      )}

      {/* Case Study Detailed Content */}
      {project.content && (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <h2 className="text-xl font-extrabold text-slate-900 mb-6 border-b border-slate-200 pb-3">
            Architecture &amp; Implementation Details
          </h2>
          <MarkdownRenderer content={project.content} />
        </div>
      )}
    </div>
  );
}
