import { slugify } from './slugify';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Extract H2 and H3 headings from markdown text for Table of Contents
 */
export function extractTableOfContents(markdown: string | null | undefined): TocItem[] {
  if (!markdown) return [];

  const lines = markdown.split('\n');
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
