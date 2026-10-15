/**
 * Convert string into a URL-friendly SEO slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD') // normalize accents
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // collapse whitespace and underscores to a single hyphen
    .replace(/^-+|-+$/g, ''); // trim leading and trailing hyphens
}

/**
 * Validates whether a slug is well-formatted
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
