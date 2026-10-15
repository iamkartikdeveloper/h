import React from 'react';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils/reading-time';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  FolderGit2,
  Mail,
  ExternalLink,
  Code2,
  Smartphone,
  Layers,
  Flame,
  DollarSign,
  Play,
  Clock,
  Compass,
} from 'lucide-react';
import { GitHubIcon } from '@/components/ui/Icons';

export default async function HomePage() {
  const supabase = createServerClient();

  // Fetch Profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .single();

  // Fetch Website Settings
  const { data: siteSettings } = await supabase
    .from('website_settings')
    .select('setting_value')
    .eq('setting_key', 'site_config')
    .single();

  // Fetch Featured & Latest Published Tutorials
  const { data: tutorials } = await supabase
    .from('tutorials')
    .select(`
      id,
      title,
      slug,
      description,
      thumbnail_url,
      youtube_url,
      difficulty,
      reading_time,
      is_featured,
      published_at,
      category:categories(name, slug)
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(6);

  // Fetch Featured Projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .limit(3);

  // Fetch Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, description, icon')
    .limit(6);

  const heroHeading =
    siteSettings?.setting_value?.hero_heading ||
    'Crafting Scalable Mobile Apps & Educating 100K+ Developers';
  const heroSubheading =
    siteSettings?.setting_value?.hero_subheading ||
    'Explore production-grade Android, Flutter, and Full-Stack tutorials with complete source code, video walk-throughs, and step-by-step guides.';
  const announcement = siteSettings?.setting_value?.announcement_banner;

  const skillsList = profile?.skills || [
    'Android Development',
    'Kotlin',
    'Java',
    'Flutter',
    'Dart',
    'Google AdMob',
    'Firebase',
    'Next.js 14',
    'TypeScript',
    'Tailwind CSS',
    'Supabase',
    'REST APIs',
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-sky-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-[600px] -right-20 w-[400px] h-[400px] bg-sky-500/10 blur-3xl pointer-events-none rounded-full" />

      {/* 1. HERO SECTION */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Announcement pill */}
          {announcement && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-medium shadow-sm hover:bg-indigo-500/20 transition-all">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{announcement}</span>
            </div>
          )}

          {/* Profile Photo / Avatar with Glowing Border */}
          <div className="relative group my-2">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-400 shadow-xl shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
              <img
                src={
                  profile?.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'
                }
                alt={profile?.display_name || 'Kartik Sharma'}
                className="w-full h-full rounded-full object-cover border-2 border-slate-950"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1.5 rounded-full border-2 border-slate-950" title="Available for projects">
              <span className="block w-2.5 h-2.5 rounded-full bg-slate-950 animate-pulse" />
            </div>
          </div>

          {/* Hero Titles */}
          <div className="max-w-3xl space-y-3">
            <p className="text-xs sm:text-sm font-mono uppercase tracking-widest text-indigo-400 font-semibold">
              Hello, I am {profile?.display_name || 'Kartik Sharma'}
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              {heroHeading}
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed pt-2">
              {heroSubheading}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link href="/tutorials">
              <Button size="lg" variant="glow" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Browse Tutorials
              </Button>
            </Link>
            <Link href="/projects">
              <Button size="lg" variant="secondary" leftIcon={<FolderGit2 className="w-4 h-4" />}>
                View Projects
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" leftIcon={<Mail className="w-4 h-4" />}>
                Contact Me
              </Button>
            </Link>
          </div>

          {/* Social Proof Stats */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-12 border-t border-slate-800/80 w-full max-w-4xl mt-8">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                {siteSettings?.setting_value?.youtube_subscribers || '125K+'}
              </div>
              <div className="text-xs text-slate-400 mt-1">YouTube Subscribers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-sky-400 font-mono">
                {siteSettings?.setting_value?.total_views || '4.8M+'}
              </div>
              <div className="text-xs text-slate-400 mt-1">Video Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400 font-mono">
                {tutorials?.length ? `${tutorials.length}+` : '20+'}
              </div>
              <div className="text-xs text-slate-400 mt-1">Free In-Depth Guides</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">100%</div>
              <div className="text-xs text-slate-400 mt-1">Free Source Code</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SKILLS & TECHNOLOGIES TICKER / GRID */}
      <section className="py-12 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
              Core Technical Stack &amp; Frameworks
            </h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {skillsList.map((skill: string, index: number) => (
              <span
                key={index}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-medium text-slate-200 transition-colors shadow-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 3. LATEST YOUTUBE TUTORIALS */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-mono uppercase tracking-wider font-semibold mb-2">
              <BookOpen className="w-4 h-4" />
              <span>Learn by Building</span>
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Latest YouTube Tutorials &amp; Source Code
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Every video comes with full step-by-step documentation, architecture breakdown, and downloadable code.
            </p>
          </div>
          <Link href="/tutorials">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View All Tutorials
            </Button>
          </Link>
        </div>

        {/* Tutorial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorials && tutorials.length > 0 ? (
            tutorials.map((tutorial) => {
              const categoryName = (tutorial.category as any)?.name || 'Development';
              return (
                <Link
                  key={tutorial.id}
                  href={`/tutorials/${tutorial.slug}`}
                  className="glass-card rounded-2xl overflow-hidden flex flex-col group border border-slate-800"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                    <img
                      src={
                        tutorial.thumbnail_url ||
                        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800'
                      }
                      alt={tutorial.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3">
                      <Badge variant="primary" size="sm">
                        {categoryName}
                      </Badge>
                    </div>
                    {tutorial.youtube_url && (
                      <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {tutorial.reading_time || 8} min read
                        </span>
                        <span>•</span>
                        <span className="text-sky-400 font-medium">{tutorial.difficulty}</span>
                      </div>
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {tutorial.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {tutorial.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>{formatDate(tutorial.published_at)}</span>
                      <span className="text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Read Guide <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-slate-400">
              No tutorials published yet. Check back soon!
            </div>
          )}
        </div>
      </section>

      {/* 4. TUTORIAL CATEGORIES */}
      <section className="py-16 bg-slate-900/30 border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-white tracking-tight">Explore by Topic</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Dive deep into specific ecosystems from Android native apps to Google AdMob revenue optimization.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories && categories.length > 0 ? (
              categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/tutorials?category=${cat.slug}`}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40 transition-all flex items-start gap-4 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {cat.description || 'Comprehensive video guides and source code tutorials.'}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center text-slate-400 text-xs">
                Categories are loading...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. FEATURED PROJECTS SHOWCASE */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-mono uppercase tracking-wider font-semibold mb-2">
              <FolderGit2 className="w-4 h-4" />
              <span>Production Work</span>
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Featured Portfolio Projects
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Real-world open source projects, mobile applications, and software tools built with production standards.
            </p>
          </div>
          <Link href="/projects">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              All Projects
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects && projects.length > 0 ? (
            projects.map((project) => (
              <div
                key={project.id}
                className="glass-card rounded-2xl overflow-hidden flex flex-col group border border-slate-800"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                  <img
                    src={
                      project.thumbnail_url ||
                      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800'
                    }
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {project.technologies?.slice(0, 3).map((tech: string, i: number) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/50"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center gap-3">
                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                      >
                        <GitHubIcon className="w-3.5 h-3.5" />
                        <span>Code</span>
                      </a>
                    )}
                    {project.demo_url && (
                      <a
                        href={project.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-md shadow-indigo-600/30 transition-colors"
                      >
                        <span>Live Demo</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-slate-400">
              No projects to display right now.
            </div>
          )}
        </div>
      </section>

      {/* 6. ABOUT SUMMARY / CTA */}
      <section className="py-20 bg-slate-900/30 border-t border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Badge variant="gradient" size="md">
            Let's Collaborate
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Need high-performance mobile apps or technical consulting?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Whether you want to build a new Android or Flutter app from scratch, integrate Google AdMob monetization strategies, or collaborate on developer content, I'd love to chat.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/contact">
              <Button size="lg" variant="primary" leftIcon={<Mail className="w-4 h-4" />}>
                Send a Message
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline">
                Read Full Bio &amp; Journey
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
