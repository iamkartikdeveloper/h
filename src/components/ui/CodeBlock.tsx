'use client';

import React, { useState } from 'react';
import { Check, Copy, Terminal, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string | null;
  explanation?: string | null;
  showLineNumbers?: boolean;
  className?: string;
}

export function CodeBlock({
  code,
  language = 'typescript',
  title,
  explanation,
  showLineNumbers = true,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const lines = code.trim().split('\n');

  // Simple token highlighter for keywords, strings, comments, numbers
  const highlightSyntax = (line: string) => {
    // Escape HTML entities
    let escaped = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Comments
    if (escaped.trim().startsWith('//') || escaped.trim().startsWith('#')) {
      return `<span class="text-slate-500 italic">${escaped}</span>`;
    }

    // Strings
    escaped = escaped.replace(/(["'`])(.*?)\1/g, '<span class="text-emerald-700 font-medium">$1$2$1</span>');

    // Keywords (Kotlin, Dart, Java, TS, XML, Bash)
    const keywords = [
      'import', 'export', 'from', 'const', 'let', 'var', 'function', 'class', 'interface', 'type',
      'return', 'if', 'else', 'for', 'while', 'new', 'override', 'fun', 'val', 'package', 'private',
      'public', 'protected', 'final', 'async', 'await', 'try', 'catch', 'throw', 'dependencies',
      'implementation', 'void', 'int', 'String', 'bool', 'boolean', 'Future', 'Response', 'SELECT', 'FROM', 'WHERE'
    ];

    const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    escaped = escaped.replace(keywordRegex, '<span class="text-indigo-700 font-bold">$1</span>');

    // Decorators / Annotations / Tags
    escaped = escaped.replace(/(@\w+)/g, '<span class="text-amber-700 font-semibold">$1</span>');

    return escaped;
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white overflow-hidden my-6 shadow-sm transition-all',
        className
      )}
    >
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          {title ? (
            <span className="text-xs font-semibold text-slate-800 ml-2 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-indigo-600" />
              {title}
            </span>
          ) : (
            <span className="text-xs uppercase font-mono tracking-wider text-slate-600 font-bold ml-1">
              {language}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {title && (
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-600 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-semibold">
              {language}
            </span>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-all cursor-pointer shadow-xs"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Body */}
      <div className="p-4 overflow-x-auto text-sm font-mono leading-relaxed bg-slate-50/60">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-slate-100/70 transition-colors">
                {showLineNumbers && (
                  <td className="pr-4 select-none text-right text-slate-400 font-mono text-xs align-top w-8">
                    {idx + 1}
                  </td>
                )}
                <td
                  className="text-slate-900 whitespace-pre font-mono"
                  dangerouslySetInnerHTML={{ __html: highlightSyntax(line) }}
                />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Optional Explanation Footer */}
      {explanation && (
        <div className="px-4 py-2.5 bg-indigo-50/50 border-t border-indigo-100 text-xs text-slate-700 flex items-start gap-2">
          <span className="font-bold text-indigo-700 uppercase tracking-wider text-[10px] mt-0.5">
            Note:
          </span>
          <span>{explanation}</span>
        </div>
      )}
    </div>
  );
}
