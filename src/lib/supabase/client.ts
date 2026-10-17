import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXTPUBLICSUPABASE_URL ||
  'https://igrritzxmfjymshjdphy.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXTPUBLICSUPABASEPUBLISHABLEKEY ||
  'sb_publishable_sJj6tpWldPBL8GDtJUtYLA_NQ9G9jXf';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL or Publishable Key is missing. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
  );
}

/**
 * Creates or retrieves the singleton client-side Supabase client.
 * Using @supabase/ssr createBrowserClient ensures authentication cookies
 * are synchronized automatically with the Next.js server proxy / middleware.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Client-side singleton export for component usage
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
