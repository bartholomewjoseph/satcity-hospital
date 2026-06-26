import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ?? import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing Supabase URL. Set VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL in .env.local.");
}

const supabaseKey = supabaseServiceRoleKey ?? supabaseAnonKey;
if (!supabaseKey) {
  throw new Error("Missing Supabase key. Set VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_SERVICE_ROLE_KEY in .env.local.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
