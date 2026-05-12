import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { tryGetSupabasePublicEnv } from "@/lib/supabase/env";

function displayNameFromUser(user: User | null): string | null {
  if (!user?.user_metadata) return null;
  const m = user.user_metadata as Record<string, unknown>;

  const full = typeof m.full_name === "string" ? m.full_name.trim() : "";
  if (full) return full;

  const first = typeof m.first_name === "string" ? m.first_name.trim() : "";
  const last = typeof m.last_name === "string" ? m.last_name.trim() : "";
  const combined = [first, last].filter(Boolean).join(" ");
  if (combined) return combined;

  const name = typeof m.name === "string" ? m.name.trim() : "";
  if (name) return name;

  return null;
}

export async function readCampusSession() {
  if (!tryGetSupabasePublicEnv()) {
    return {
      authed: false as const,
      email: null as string | null,
      displayName: null as string | null,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    authed: Boolean(user),
    email: user?.email ?? null,
    displayName: displayNameFromUser(user ?? null),
  };
}
