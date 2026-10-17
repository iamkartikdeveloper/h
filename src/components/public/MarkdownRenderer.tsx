'use client';

import React from 'react';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { slugify } from '@/lib/utils/slugify';
import { normalizeMarkdown } from '@/lib/utils/markdown';
import {
  Info,
  Lightbulb,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null;

  // 1. Normalize escaped newlines (\n, \r\n) into real linebreaks
  const cleanContent = normalizeMarkdown(content);

  // 2. Split markdown by code blocks (```language\n...```)
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(cleanContent)) !== null) {
    const textBefore = cleanContent.substring(lastIndex, match.index);
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

  const remainingText = cleanContent.substring(lastIndex);
  if (remainingText) {
    parts.push(renderTextMarkdown(remainingText, `text-end-${lastIndex}`));
  }

  return (
    <div className={`prose max-w-none text-slate-800 leading-relaxed space-y-4 ${className}`}>
      {parts}
    </div>
  );
}

function renderTextMarkdown(text: string, keyPrefix: string) {
  // Split on double newlines to separate distinct blocks / paragraphs
  const blocks = text.split(/\n\n+/);

  return (
    <React.Fragment key={keyPrefix}>
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // 1. Heading 1 (# ...)
        if (trimmed.startsWith('# ')) {
          const title = trimmed.replace(/^#\s+/, '');
          const id = slugify(title);
          return (
            <h1
              key={`${keyPrefix}-h1-${idx}`}
              id={id}
              className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-8 mb-4 tracking-tight border-b border-slate-200 pb-3"
            >
              {title}
            </h1>
          );
        }

        // 2. Heading 2 (## ...)
        if (trimmed.startsWith('## ')) {
          const title = trimmed.replace(/^##\s+/, '');
          const id = slugify(title);
          return (
            <h2
              key={`${keyPrefix}-h2-${idx}`}
              id={id}
              className="text-xl md:text-2xl font-bold text-slate-900 mt-8 mb-3 tracking-tight flex items-center gap-2 group scroll-mt-24"
            >
              <span>{title}</span>
              <a
                href={`#${id}`}
                className="text-slate-400 opacity-0 group-hover:opacity-100 hover:text-indigo-600 text-lg transition-opacity"
              >
                #
              </a>
            </h2>
          );
        }

        // 3. Heading 3 (### ...)
        if (trimmed.startsWith('### ')) {
          const title = trimmed.replace(/^###\s+/, '');
          const id = slugify(title);
          return (
            <h3
              key={`${keyPrefix}-h3-${idx}`}
              id={id}
              className="text-lg md:text-xl font-bold text-slate-900 mt-6 mb-2 tracking-tight scroll-mt-24"
            >
              {title}
            </h3>
          );
        }

        // 4. Heading 4 (#### ...)
        if (trimmed.startsWith('#### ')) {
          const title = trimmed.replace(/^####\s+/, '');
          const id = slugify(title);
          return (
            <h4
              key={`${keyPrefix}-h4-${idx}`}
              id={id}
              className="text-base font-bold text-slate-900 mt-5 mb-2 tracking-tight"
            >
              {title}
            </h4>
          );
        }

        // 5. Horizontal Rule (--- or ***)
        if (trimmed === '---' || trimmed === '***') {
          return <hr key={`${keyPrefix}-hr-${idx}`} className="my-8 border-slate-200" />;
        }

        // 6. GitHub-style Callouts / Alerts (> [!NOTE], > [!TIP], > [!WARNING], > [!IMPORTANT])
        if (trimmed.startsWith('> [!')) {
          const alertTypeMatch = trimmed.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n?([\s\S]*)$/i);
          if (alertTypeMatch) {
            const type = alertTypeMatch[1].toUpperCase();
            const message = alertTypeMatch[2].replace(/^>\s?/gm, '').trim();

            const alertConfig: Record<string, { bg: string; border: string; text: string; icon: any; title: string }> = {
              NOTE: {
                bg: 'bg-indigo-50/70',
                border: 'border-indigo-200',
                text: 'text-indigo-950',
                icon: Info,
                title: 'Note',
              },
              TIP: {
                bg: 'bg-emerald-50/70',
                border: 'border-emerald-200',
                text: 'text-emerald-950',
                icon: Lightbulb,
                title: 'Tip',
              },
              IMPORTANT: {
                bg: 'bg-sky-50/70',
                border: 'border-sky-200',
                text: 'text-sky-950',
                icon: CheckCircle2,
                title: 'Important',
              },
              WARNING: {
                bg: 'bg-amber-50/70',
                border: 'border-amber-200',
                text: 'text-amber-950',
                icon: AlertTriangle,
                title: 'Warning',
              },
              CAUTION: {
                bg: 'bg-rose-50/70',
                border: 'border-rose-200',
                text: 'text-rose-950',
                icon: AlertOctagon,
                title: 'Caution',
              },
            };

            const config = alertConfig[type] || alertConfig.NOTE;
            const Icon = config.icon;

            return (
              <div
                key={`${keyPrefix}-alert-${idx}`}
                className={`my-5 p-4 rounded-2xl border ${config.bg} ${config.border} flex items-start gap-3 shadow-2xs`}
              >
                <Icon className="w-5 h-5 shrink-0 mt-0.5 text-indigo-600" />
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider block text-slate-900">
                    {config.title}
                  </span>
                  <div
                    className={`text-sm leading-relaxed ${config.text}`}
                    dangerouslySetInnerHTML={{ __html: formatInline(message) }}
                  />
                </div>
              </div>
            );
          }
        }

        // 7. Standard Blockquote (> ...)
        if (trimmed.startsWith('> ')) {
          const quote = trimmed.replace(/^>\s*/gm, '');
          return (
            <div
              key={`${keyPrefix}-quote-${idx}`}
              className="my-4 p-4 rounded-2xl border-l-4 border-indigo-600 bg-slate-50 text-slate-800 flex items-start gap-3 shadow-2xs"
            >
              <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatInline(quote) }}
              />
            </div>
          );
        }

        // 8. Markdown Tables (| header 1 | header 2 | ...)
        if (trimmed.startsWith('|') && trimmed.includes('\n|')) {
          const lines = trimmed.split('\n').filter((l) => l.trim().startsWith('|'));
          if (lines.length >= 2) {
            const headerCells = lines[0]
              .split('|')
              .slice(1, -1)
              .map((c) => c.trim());

            // Skip index 1 if it's the divider (|---|---|)
            const rowLines = lines.slice(1).filter((l) => !l.replace(/[|\s-:]/g, '').length === false);

            return (
              <div key={`${keyPrefix}-table-${idx}`} className="my-6 overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-100/80 text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200">
                    <tr>
                      {headerCells.map((h, hIdx) => (
                        <th key={hIdx} className="px-4 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {rowLines.map((row, rIdx) => {
                      const cells = row
                        .split('|')
                        .slice(1, -1)
                        .map((c) => c.trim());
                      return (
                        <tr key={rIdx} className="hover:bg-slate-50/60 transition-colors">
                          {cells.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className="px-4 py-3 text-slate-800 font-normal"
                              dangerouslySetInnerHTML={{ __html: formatInline(cell) }}
                            />
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          }
        }

        // 9. Unordered List (- or *)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const items = trimmed
            .split('\n')
            .filter((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '));
          return (
            <ul
              key={`${keyPrefix}-ul-${idx}`}
              className="list-disc list-inside space-y-2 my-3 text-slate-700 text-sm md:text-base pl-2"
            >
              {items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className="leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: formatInline(item.replace(/^[-*]\s+/, '')),
                  }}
                />
              ))}
            </ul>
          );
        }

        // 10. Ordered List (1. , 2. ...)
        if (/^\d+\.\s+/.test(trimmed)) {
          const items = trimmed.split('\n').filter((l) => /^\d+\.\s+/.test(l.trim()));
          return (
            <ol
              key={`${keyPrefix}-ol-${idx}`}
              className="list-decimal list-inside space-y-2 my-3 text-slate-700 text-sm md:text-base pl-2"
            >
              {items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className="leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: formatInline(item.replace(/^\d+\.\s+/, '')),
                  }}
                />
              ))}
            </ol>
          );
        }

        // 11. Regular Paragraph with inline formatting
        // If block contains single newlines within the paragraph, preserve soft linebreaks
        const formattedParagraph = trimmed
          .split('\n')
          .map((line) => formatInline(line))
          .join('<br />');

        return (
          <p
            key={`${keyPrefix}-p-${idx}`}
            className="text-slate-800 text-sm md:text-base leading-relaxed my-3"
            dangerouslySetInnerHTML={{ __html: formattedParagraph }}
          />
        );
      })}
    </React.Fragment>
  );
}

function formatInline(str: string): string {
  if (!str) return '';

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Images: ![alt](url)
    .replace(
      /!\[(.*?)\]\((.*?)\)/g,
      '<img src="$2" alt="$1" class="rounded-2xl border border-slate-200 my-4 max-w-full shadow-sm" />'
    )
    // Links: [text](url)
    .replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-700 font-semibold underline underline-offset-2">$1</a>'
    )
    // Bold: **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
    // Italic: *text* or _text_
    .replace(/\*(.*?)\*/g, '<em class="italic text-slate-800">$1</em>')
    // Strikethrough: ~~text~~
    .replace(/~~(.*?)~~/g, '<del class="line-through text-slate-400">$1</del>')
    // Inline code: `code`
    .replace(
      /`([^`]+)`/g,
      '<code class="px-1.5 py-0.5 rounded-lg bg-slate-100 text-indigo-700 text-xs font-mono font-semibold border border-slate-200">$1</code>'
    );
}
