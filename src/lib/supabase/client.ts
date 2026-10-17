import { createClient } from '@supabase/supabase-js';

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

// Client-side singleton
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
