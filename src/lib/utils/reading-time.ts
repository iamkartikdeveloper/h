/**
 * Estimate reading time in minutes based on average reading speed (200 words per minute)
 */
export function calculateReadingTime(content: string | null | undefined): number {
  if (!content) return 3;
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(words / 200);
  return Math.max(1, minutes);
}

/**
 * Format date into human-readable string (e.g. Oct 15, 2026)
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Recently';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}
