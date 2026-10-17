import { slugify } from './slugify';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Normalizes markdown text by converting literal escaped newlines ("\n", "\r\n")
 * and mixed line endings into real newline characters.
 */
export function normalizeMarkdown(markdown: string | null | undefined): string {
  if (!markdown) return '';

  let normalized = String(markdown);

  // If text contains literal escaped characters (\r\n or \n)
  if (normalized.includes('\\n') || normalized.includes('\\r')) {
    normalized = normalized
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\n');
  }

  // Normalize windows newlines
  normalized = normalized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  return normalized;
}

/**
 * Extract H2 and H3 headings from markdown text for Table of Contents
 */
export function extractTableOfContents(markdown: string | null | undefined): TocItem[] {
  if (!markdown) return [];

  const clean = normalizeMarkdown(markdown);
  const lines = clean.split('\n');
  const toc: TocItem[] = [];

  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.*)$/);
    if (match) {
      const level = match[1].length; // 2 or 3
      const rawText = match[2].trim().replace(/\*\*/g, '').replace(/`/g, '');
      const id = slugify(rawText);

      if (rawText && id) {
        toc.push({ id, text: rawText, level });
      }
    }
  }

  return toc;
}
