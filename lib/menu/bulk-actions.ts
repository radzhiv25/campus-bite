"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { readCampusSession } from "@/lib/session";
import type { MenuDraftInput } from "@/lib/menu-scan/types";

const draftSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(2000).optional(),
  price: z
    .string()
    .trim()
    .min(1, "Price is required")
    .refine((v) => Number.isFinite(Number.parseFloat(v)) && Number.parseFloat(v) >= 0, "Invalid price"),
});

const bulkSchema = z.array(draftSchema).min(1, "Select at least one item to import").max(100);

export type BulkInsertMenuState = {
  ok?: boolean;
  error?: string;
  inserted?: number;
  fieldErrors?: Record<string, string>;
};

function revalidateMenuPaths() {
  revalidatePath("/menu");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
}

async function requireAdmin(): Promise<{ ok: true } | { error: string }> {
  const session = await readCampusSession();
  if (!session.authed || !session.isAdmin) {
    return { error: "You must be signed in as an admin." };
  }
  return { ok: true };
}

export async function bulkInsertMenuItemsAction(
  drafts: MenuDraftInput[]
): Promise<BulkInsertMenuState> {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return { error: admin.error };
  }

  const parsed = bulkSchema.safeParse(
    drafts.map((d) => ({
      name: d.name,
      description: d.description?.trim() ? d.description.trim() : undefined,
      price: d.price,
    }))
  );

  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Invalid menu items. Check names and prices.";
    return { error: msg };
  }

  const rows = parsed.data.map((item) => ({
    name: item.name,
    description: item.description ?? "",
    price_cents: Math.round(Number.parseFloat(item.price) * 100),
    image_url: null,
    is_available: false,
    sort_order: 0,
  }));

  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").insert(rows);

  if (error) {
    if (error.code === "42501" || /permission denied|row-level security/i.test(error.message)) {
      return {
        error:
          "Database blocked this change. Ensure your Supabase user has app_metadata.role = \"admin\" (see README) and that the menu_items policies are applied.",
      };
    }
    if (error.code === "42P01" || /relation .* does not exist/i.test(error.message)) {
      return {
        error:
          "The menu_items table was not found. Create it in your Supabase project (SQL editor or migrations), then try again.",
      };
    }
    return { error: error.message };
  }

  revalidateMenuPaths();
  return { ok: true, inserted: rows.length };
}
