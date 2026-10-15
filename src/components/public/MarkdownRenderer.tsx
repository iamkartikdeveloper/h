'use client';

import React from 'react';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { slugify } from '@/lib/utils/slugify';
import { ExternalLink, Info } from 'lucide-react';

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null;

  // Split markdown by code blocks to safely extract code from text
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push(renderTextMarkdown(textBefore, `text-${lastIndex}`));
    }

    const language = match[1] || 'text';
    const code = match[2] || '';
    parts.push(
      <CodeBlock
        key={`code-${match.index}`}
        code={code}
        language={language}
        showLineNumbers={true}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    parts.push(renderTextMarkdown(remainingText, `text-end-${lastIndex}`));
  }

  return (
    <div className={`prose prose-invert max-w-none text-slate-300 leading-relaxed space-y-4 ${className}`}>
      {parts}
    </div>
  );
}

function renderTextMarkdown(text: string, keyPrefix: string) {
  const blocks = text.split(/\n\n+/);

  return (
    <React.Fragment key={keyPrefix}>
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Heading 1
        if (trimmed.startsWith('# ')) {
          const title = trimmed.replace(/^#\s+/, '');
          const id = slugify(title);
          return (
            <h1
              key={`${keyPrefix}-h1-${idx}`}
              id={id}
              className="text-2xl md:text-3xl font-extrabold text-white mt-8 mb-4 tracking-tight border-b border-slate-800 pb-3"
            >
              {title}
            </h1>
          );
        }

        // Heading 2
        if (trimmed.startsWith('## ')) {
          const title = trimmed.replace(/^##\s+/, '');
          const id = slugify(title);
          return (
            <h2
              key={`${keyPrefix}-h2-${idx}`}
              id={id}
              className="text-xl md:text-2xl font-bold text-white mt-8 mb-3 tracking-tight flex items-center gap-2 group scroll-mt-24"
            >
              <span>{title}</span>
              <a href={`#${id}`} className="text-slate-600 opacity-0 group-hover:opacity-100 hover:text-indigo-400 text-lg transition-opacity">
                #
              </a>
            </h2>
          );
        }

        // Heading 3
        if (trimmed.startsWith('### ')) {
          const title = trimmed.replace(/^###\s+/, '');
          const id = slugify(title);
          return (
            <h3
              key={`${keyPrefix}-h3-${idx}`}
              id={id}
              className="text-lg md:text-xl font-semibold text-slate-100 mt-6 mb-2 tracking-tight scroll-mt-24"
            >
              {title}
            </h3>
          );
        }

        // Blockquote / Alert
        if (trimmed.startsWith('> ')) {
          const quote = trimmed.replace(/^>\s*/gm, '');
          return (
            <div
              key={`${keyPrefix}-quote-${idx}`}
              className="my-4 p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 text-slate-300 flex items-start gap-3"
            >
              <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(quote) }} />
            </div>
          );
        }

        // Unordered list
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const items = trimmed.split('\n').filter((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '));
          return (
            <ul key={`${keyPrefix}-ul-${idx}`} className="list-disc list-inside space-y-1.5 my-3 text-slate-300 text-sm pl-2">
              {items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  dangerouslySetInnerHTML={{
                    __html: formatInline(item.replace(/^[-*]\s+/, '')),
                  }}
                />
              ))}
            </ul>
          );
        }

        // Ordered list
        if (/^\d+\.\s+/.test(trimmed)) {
          const items = trimmed.split('\n').filter((l) => /^\d+\.\s+/.test(l.trim()));
          return (
            <ol key={`${keyPrefix}-ol-${idx}`} className="list-decimal list-inside space-y-1.5 my-3 text-slate-300 text-sm pl-2">
              {items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  dangerouslySetInnerHTML={{
                    __html: formatInline(item.replace(/^\d+\.\s+/, '')),
                  }}
                />
              ))}
            </ol>
          );
        }

        // Paragraph
        return (
          <p
            key={`${keyPrefix}-p-${idx}`}
            className="text-slate-300 text-sm md:text-base leading-relaxed my-2"
            dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
          />
        );
      })}
    </React.Fragment>
  );
}

function formatInline(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-slate-200">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 text-xs font-mono border border-slate-700/60">$1</code>')
    .replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">$1</a>'
    );
}
