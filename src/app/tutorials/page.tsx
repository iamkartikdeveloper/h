'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Tutorial, Category } from '@/types/database';
import { MOCK_TUTORIALS, MOCK_CATEGORIES } from '@/lib/mock-data';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils/reading-time';
import {
  Search,
  BookOpen,
  Filter,
  Play,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  X,
  Compass,
} from 'lucide-react';

export default function TutorialsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 text-xs">
          Loading tutorials catalog...
        </div>
      }
    >
      <TutorialsContent />
    </Suspense>
  );
}

function TutorialsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState<'latest' | 'reading_time'>('latest');

  // Debounced query state
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTutorials();
  }, [debouncedQuery, selectedCategory, selectedDifficulty, sortBy]);

  const fetchCategories = async () => {
    try {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (data && data.length > 0) {
        setCategories(data);
      } else {
        setCategories(MOCK_CATEGORIES);
      }
    } catch {
      setCategories(MOCK_CATEGORIES);
    }
  };

  const fetchTutorials = async () => {
    try {
      setLoading(true);
      let query = supabase
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
        .eq('status', 'published');

      if (debouncedQuery.trim()) {
        const q = debouncedQuery.trim();
        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,content.ilike.%${q}%`);
      }

      if (selectedCategory !== 'all') {
        const cat = categories.find((c) => c.slug === selectedCategory);
        if (cat) {
          query = query.eq('category_id', cat.id);
        }
      }

      if (selectedDifficulty !== 'all') {
        query = query.eq('difficulty', selectedDifficulty);
      }

      if (sortBy === 'latest') {
        query = query.order('published_at', { ascending: false });
      } else {
        query = query.order('reading_time', { ascending: false });
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        // Fallback filter
        let filtered = [...MOCK_TUTORIALS];
        if (debouncedQuery.trim()) {
          const q = debouncedQuery.toLowerCase();
          filtered = filtered.filter(
            (t) =>
              t.title.toLowerCase().includes(q) ||
              t.description?.toLowerCase().includes(q)
          );
        }
        if (selectedCategory !== 'all') {
          filtered = filtered.filter((t) => t.category?.slug === selectedCategory);
        }
        if (selectedDifficulty !== 'all') {
          filtered = filtered.filter((t) => t.difficulty === selectedDifficulty);
        }
        setTutorials(filtered);
      } else {
        setTutorials((data as any) || []);
      }
    } catch {
      let filtered = [...MOCK_TUTORIALS];
      if (debouncedQuery.trim()) {
        const q = debouncedQuery.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.description?.toLowerCase().includes(q)
        );
      }
      if (selectedCategory !== 'all') {
        filtered = filtered.filter((t) => t.category?.slug === selectedCategory);
      }
      if (selectedDifficulty !== 'all') {
        filtered = filtered.filter((t) => t.difficulty === selectedDifficulty);
      }
      setTutorials(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (keyword: string) => {
    setSearchQuery(keyword);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-10">
      {/* Page Header */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 text-indigo-600 text-xs font-mono uppercase tracking-wider font-bold">
          <BookOpen className="w-4 h-4" />
          <span>Educational Platform</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
          Tutorial Library &amp; Source Code
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Search comprehensive step-by-step guides for Android, Google AdMob, Firebase, Flutter, and Next.js. Every guide includes full working source code and YouTube video walkthroughs.
        </p>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        {/* Search Bar Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by topic, e.g. 'AdMob', 'Banner Ads', 'Firebase', 'Flutter'..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-12 pr-10 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggestion Quick Tags */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Quick Suggestions:</span>
          {['AdMob', 'Banner Ads', 'Interstitial Ads', 'Firebase', 'Flutter', 'Kotlin', 'Supabase'].map(
            (tag) => (
              <button
                key={tag}
                onClick={() => handleSuggestionClick(tag)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200 font-medium"
              >
                {tag}
              </button>
            )
          )}
        </div>

        {/* Categories Pills & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-t border-slate-200">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.slug
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Secondary Filters (Difficulty & Sort) */}
          <div className="flex items-center gap-3 shrink-0 text-xs">
            {/* Difficulty Select */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-700 outline-none focus:border-indigo-600 shadow-2xs"
            >
              <option value="all">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-700 outline-none focus:border-indigo-600 shadow-2xs"
            >
              <option value="latest">Sort: Newest First</option>
              <option value="reading_time">Sort: In-Depth / Length</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tutorials Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden animate-pulse space-y-4 p-4"
            >
              <div className="w-full aspect-video bg-slate-100 rounded-xl" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : tutorials.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-white border border-slate-200 shadow-xs p-8 space-y-4">
          <Compass className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No tutorials found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {searchQuery
              ? `We couldn't find any guides matching "${searchQuery}". Try searching for "AdMob", "Kotlin", or "Flutter".`
              : 'There are no published tutorials in this category yet.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedDifficulty('all');
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-2xs"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorials.map((tutorial) => {
            const categoryName = (tutorial.category as any)?.name || 'Development';
            return (
              <Link
                key={tutorial.id}
                href={`/tutorials/${tutorial.slug}`}
                className="light-card rounded-2xl overflow-hidden flex flex-col group border border-slate-200 bg-white"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  <img
                    src={
                      tutorial.thumbnail_url ||
                      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800'
                    }
                    alt={tutorial.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="primary" size="sm">
                      {categoryName}
                    </Badge>
                  </div>
                  {tutorial.youtube_url && (
                    <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {tutorial.reading_time || 8} min read
                      </span>
                      <span>•</span>
                      <span className="text-indigo-600 font-semibold">{tutorial.difficulty}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {tutorial.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {tutorial.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>{formatDate(tutorial.published_at)}</span>
                    <span className="text-indigo-600 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Read Guide <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
