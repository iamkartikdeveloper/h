'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MarkdownRenderer } from '@/components/public/MarkdownRenderer';
import { normalizeMarkdown } from '@/lib/utils/markdown';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Code,
  FileCode,
  Quote,
  List,
  ListOrdered,
  Link as LinkIcon,
  Table,
  Eye,
  Edit3,
  Columns,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minHeight?: string;
  required?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  label = 'Tutorial Documentation (Markdown) *',
  placeholder = 'Write your tutorial documentation here in standard Markdown...',
  minHeight = 'min-h-[420px]',
  required = false,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'split'>('write');
  const [cleanedNotice, setCleanedNotice] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Automatically normalize literal escaped newlines (\n) on initial load if present
  useEffect(() => {
    if (value && (value.includes('\\n') || value.includes('\\r'))) {
      const clean = normalizeMarkdown(value);
      onChange(clean);
    }
  }, []);

  const handleCleanLinebreaks = () => {
    const clean = normalizeMarkdown(value);
    onChange(clean);
    setCleanedNotice(true);
    setTimeout(() => setCleanedNotice(false), 3000);
  };

  const insertFormatting = (before: string, after: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || defaultText;

    const replacement = `${before}${selectedText}${after}`;
    const newValue = value.substring(0, start) + replacement + value.substring(end);

    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 10);
  };

  // Quick toolbar helpers
  const handleBold = () => insertFormatting('**', '**', 'bold text');
  const handleItalic = () => insertFormatting('*', '*', 'italic text');
  const handleH1 = () => insertFormatting('\n# ', '\n', 'Heading 1');
  const handleH2 = () => insertFormatting('\n## ', '\n', 'Heading 2');
  const handleH3 = () => insertFormatting('\n### ', '\n', 'Heading 3');
  const handleInlineCode = () => insertFormatting('`', '`', 'code');
  const handleCodeBlock = (lang = 'kotlin') =>
    insertFormatting(`\n\`\`\`${lang}\n`, '\n```\n', '// Enter code here');
  const handleQuote = () => insertFormatting('\n> ', '\n', 'Important note or quote');
  const handleAlert = () =>
    insertFormatting('\n> [!NOTE]\n> ', '\n', 'Provide essential context or tips here');
  const handleBulletList = () => insertFormatting('\n- ', '\n', 'List item');
  const handleNumberedList = () => insertFormatting('\n1. ', '\n', 'Step one');
  const handleLink = () => insertFormatting('[', '](https://example.com)', 'Link title');
  const handleTable = () =>
    insertFormatting(
      '\n| Feature | Supported | Description |\n| :--- | :--- | :--- |\n| Banner Ads | Yes | Adaptive Banner |\n| Interstitial | Yes | Fullscreen Ad |\n',
      '',
      ''
    );

  // Statistics
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  const characters = value.length;
  const estimatedReadingTime = Math.max(1, Math.ceil(words / 180));
  const hasEscapedNewlines = value.includes('\\n') || value.includes('\\r');

  return (
    <div className="space-y-2">
      {/* Header and View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="space-y-0.5">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>{label}</span>
            {hasEscapedNewlines && (
              <span className="text-[10px] font-mono text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full font-semibold">
                Raw \n Detected
              </span>
            )}
          </label>
          <p className="text-xs text-slate-500">
            Write using Markdown with live preview, syntax highlighting, and formatting tools.
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              activeTab === 'write'
                ? 'bg-white text-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Write</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              activeTab === 'preview'
                ? 'bg-white text-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('split')}
            className={cn(
              'hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              activeTab === 'split'
                ? 'bg-white text-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split View</span>
          </button>
        </div>
      </div>

      {/* Clean Linebreaks Quick Alert (shown if raw \n is detected) */}
      {(hasEscapedNewlines || cleanedNotice) && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {cleanedNotice
                ? 'Successfully cleaned and normalized linebreaks!'
                : 'Notice: This document contains escaped "\\n" text characters. Click to format into clean real linebreaks.'}
            </span>
          </div>
          {!cleanedNotice && (
            <button
              type="button"
              onClick={handleCleanLinebreaks}
              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer shrink-0"
            >
              Fix Linebreaks Now
            </button>
          )}
        </div>
      )}

      {/* Editor Container */}
      <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-2xs focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
        {/* Markdown Toolbar (visible in Write and Split modes) */}
        {activeTab !== 'preview' && (
          <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 text-slate-700">
            <button
              type="button"
              onClick={handleH1}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-xs font-bold font-mono transition-colors"
              title="Heading 1 (# ...)"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleH2}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-xs font-bold font-mono transition-colors"
              title="Heading 2 (## ...)"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleH3}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-xs font-bold font-mono transition-colors"
              title="Heading 3 (### ...)"
            >
              <Heading3 className="w-4 h-4" />
            </button>

            <span className="w-px h-4 bg-slate-300 mx-1" />

            <button
              type="button"
              onClick={handleBold}
              className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
              title="Bold (**text**)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleItalic}
              className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
              title="Italic (*text*)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleInlineCode}
              className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors font-mono"
              title="Inline Code (`code`)"
            >
              <Code className="w-4 h-4" />
            </button>

            <span className="w-px h-4 bg-slate-300 mx-1" />

            <button
              type="button"
              onClick={() => handleCodeBlock('kotlin')}
              className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Code Block (```kotlin)"
            >
              <FileCode className="w-4 h-4 text-indigo-600" />
              <span>Kotlin</span>
            </button>

            <button
              type="button"
              onClick={() => handleCodeBlock('xml')}
              className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-xs font-semibold text-slate-600"
              title="Code Block (```xml)"
            >
              XML
            </button>

            <button
              type="button"
              onClick={() => handleCodeBlock('dart')}
              className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-xs font-semibold text-slate-600"
              title="Code Block (```dart)"
            >
              Dart
            </button>

            <span className="w-px h-4 bg-slate-300 mx-1" />

            <button
              type="button"
              onClick={handleQuote}
              className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
              title="Quote (> ...)"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleAlert}
              className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 text-xs text-indigo-700 font-semibold"
              title="Alert Box (> [!NOTE])"
            >
              <Info className="w-4 h-4" />
              <span>Callout</span>
            </button>

            <button
              type="button"
              onClick={handleBulletList}
              className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
              title="Bullet List (- item)"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNumberedList}
              className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
              title="Numbered List (1. item)"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleLink}
              className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
              title="Insert Link ([text](url))"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleTable}
              className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
              title="Insert Table"
            >
              <Table className="w-4 h-4" />
            </button>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={handleCleanLinebreaks}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                title="Convert escaped \n into clean linebreaks"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Format \n</span>
              </button>
            </div>
          </div>
        )}

        {/* Work Area */}
        <div className="relative">
          {/* 1. WRITE MODE */}
          {activeTab === 'write' && (
            <textarea
              ref={textareaRef}
              rows={18}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              required={required}
              className={cn(
                'w-full p-4 font-mono text-xs sm:text-sm text-slate-900 bg-white leading-relaxed resize-y outline-none',
                minHeight
              )}
            />
          )}

          {/* 2. PREVIEW MODE */}
          {activeTab === 'preview' && (
            <div className={cn('p-6 sm:p-8 overflow-y-auto bg-slate-50/50', minHeight)}>
              {value.trim() ? (
                <MarkdownRenderer content={value} />
              ) : (
                <div className="text-slate-400 italic text-sm text-center py-12">
                  Nothing to preview. Switch to "Write" to add tutorial markdown.
                </div>
              )}
            </div>
          )}

          {/* 3. SPLIT VIEW MODE */}
          {activeTab === 'split' && (
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              <textarea
                ref={textareaRef}
                rows={18}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                className={cn(
                  'w-full p-4 font-mono text-xs text-slate-900 bg-white leading-relaxed resize-none outline-none',
                  minHeight
                )}
              />
              <div className={cn('p-6 overflow-y-auto bg-slate-50/50', minHeight)}>
                {value.trim() ? (
                  <MarkdownRenderer content={value} />
                ) : (
                  <div className="text-slate-400 italic text-xs text-center py-12">
                    Live preview will appear here as you type...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Stats Bar */}
        <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-4">
            <span>
              Words: <strong className="text-slate-800">{words}</strong>
            </span>
            <span>
              Characters: <strong className="text-slate-800">{characters}</strong>
            </span>
            <span>
              Reading Time: <strong className="text-slate-800">~{estimatedReadingTime} min</strong>
            </span>
          </div>

          <div className="text-slate-400 text-[10px]">
            Markdown Supported • Standard GFM
          </div>
        </div>
      </div>
    </div>
  );
}
