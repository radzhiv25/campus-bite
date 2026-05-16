import type { User } from "@supabase/supabase-js";

/**
 * Admins are users with `app_metadata.role === "admin"` on their JWT.
 * Set in Supabase: Authentication → Users → select user → User Metadata / App Metadata (Raw JSON).
 */
export function userIsAdmin(user: User | null): boolean {
  if (!user) return false;
  const role = (user.app_metadata as Record<string, unknown> | undefined)?.role;
  return role === "admin";
}
