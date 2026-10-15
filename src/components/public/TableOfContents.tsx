'use client';

import React, { useEffect, useState } from 'react';
import { TocItem } from '@/lib/utils/markdown';
import { cn } from '@/lib/utils/cn';
import { List, ChevronDown } from 'lucide-react';

export interface TableOfContentsProps {
  items: TocItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  useEffect(() => {
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0% -60% 0%', threshold: 0 }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top, behavior: 'smooth' });
      setActiveId(id);
      setIsOpenMobile(false);
    }
  };

  return (
    <>
      {/* Mobile Collapsible TOC */}
      <div className="lg:hidden w-full mb-8 rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-md overflow-hidden">
        <button
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          className="w-full flex items-center justify-between p-4 text-left font-medium text-slate-200"
        >
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold">Table of Contents</span>
          </div>
          <ChevronDown
            className={cn('w-4 h-4 text-slate-400 transition-transform duration-200', isOpenMobile && 'rotate-180')}
          />
        </button>
        {isOpenMobile && (
          <nav className="p-4 pt-0 border-t border-slate-800/60 space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToHeading(item.id)}
                className={cn(
                  'block w-full text-left py-1.5 text-xs transition-colors rounded-lg px-2',
                  item.level === 3 ? 'pl-4 text-slate-400' : 'text-slate-300 font-medium',
                  activeId === item.id ? 'bg-indigo-500/10 text-indigo-400 font-semibold' : 'hover:text-white'
                )}
              >
                {item.text}
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Desktop Sticky Sidebar TOC */}
      <div className="hidden lg:block sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-4">
        <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-800 text-slate-200">
            <List className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">On this page</span>
          </div>
          <nav className="space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToHeading(item.id)}
                className={cn(
                  'block w-full text-left py-1.5 text-xs transition-all duration-200 rounded-lg px-2.5 leading-relaxed cursor-pointer',
                  item.level === 3 ? 'pl-5 text-slate-400' : 'text-slate-300 font-medium',
                  activeId === item.id
                    ? 'bg-indigo-500/15 text-indigo-400 font-semibold border-l-2 border-indigo-500 pl-3'
                    : 'hover:text-slate-100 hover:bg-slate-800/40'
                )}
              >
                {item.text}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
