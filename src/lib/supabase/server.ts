import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXTPUBLICSUPABASE_URL ||
  'https://hfsflkizdbgkauebjamu.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXTPUBLICSUPABASEPUBLISHABLEKEY ||
  'sbpublishablePEPd8cdTE5EKExCf1GzdAA_YX4Vop6D';

export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}
