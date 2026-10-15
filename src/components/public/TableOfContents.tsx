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
      <div className="lg:hidden w-full mb-8 rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <button
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          className="w-full flex items-center justify-between p-4 text-left font-medium text-slate-800"
        >
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold">Table of Contents</span>
          </div>
          <ChevronDown
            className={cn('w-4 h-4 text-slate-500 transition-transform duration-200', isOpenMobile && 'rotate-180')}
          />
        </button>
        {isOpenMobile && (
          <nav className="p-4 pt-0 border-t border-slate-100 space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToHeading(item.id)}
                className={cn(
                  'block w-full text-left py-1.5 text-xs transition-colors rounded-lg px-2',
                  item.level === 3 ? 'pl-4 text-slate-500' : 'text-slate-700 font-medium',
                  activeId === item.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 hover:text-slate-900'
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
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100 text-slate-800">
            <List className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">On this page</span>
          </div>
          <nav className="space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToHeading(item.id)}
                className={cn(
                  'block w-full text-left py-1.5 text-xs transition-all duration-200 rounded-lg px-2.5 leading-relaxed cursor-pointer',
                  item.level === 3 ? 'pl-5 text-slate-500' : 'text-slate-700 font-medium',
                  activeId === item.id
                    ? 'bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600 pl-3'
                    : 'hover:text-slate-900 hover:bg-slate-50'
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
