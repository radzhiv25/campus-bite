/**
 * Public Supabase config for browser + server (anon / publishable key only).
 * Supports legacy `anon` key or newer publishable key naming.
 */
export function getSupabasePublicEnv(): {
  supabaseUrl: string;
  supabaseKey: string;
} {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    "";

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in .env.local. See .env.example."
    );
  }

  return { supabaseUrl, supabaseKey };
}

export function tryGetSupabasePublicEnv():
  | { supabaseUrl: string; supabaseKey: string }
  | null {
  try {
    return getSupabasePublicEnv();
  } catch {
    return null;
  }
}
