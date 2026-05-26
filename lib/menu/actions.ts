"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { readCampusSession } from "@/lib/session";

const createSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(2000),
  price: z
    .string()
    .trim()
    .min(1, "Price is required")
    .refine((v) => Number.isFinite(Number.parseFloat(v)) && Number.parseFloat(v) >= 0, "Invalid price"),
  image_url: z
    .string()
    .max(2000)
    .transform((s) => s.trim())
    .transform((s) => (s === "" ? undefined : s))
    .refine(
      (s) => s === undefined || /^https:\/\//i.test(s),
      "Image URL must start with https://"
    ),
});

export type MenuItemActionState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

export type MenuItemFieldsInput = {
  name: string;
  description: string;
  price: string;
  image_url?: string;
};

function revalidateMenuPaths() {
  revalidatePath("/menu");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
}

function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const flat = error.flatten().fieldErrors;
  const fieldErrors: Record<string, string> = {};
  if (flat.name?.[0]) fieldErrors.name = flat.name[0];
  if (flat.description?.[0]) fieldErrors.description = flat.description[0];
  if (flat.price?.[0]) fieldErrors.price = flat.price[0];
  if (flat.image_url?.[0]) fieldErrors.image_url = flat.image_url[0];
  return fieldErrors;
}

function parseMenuItemFields(input: MenuItemFieldsInput) {
  return createSchema.safeParse({
    name: input.name,
    description: input.description,
    price: input.price,
    image_url: input.image_url ?? "",
  });
}

async function requireAdmin(): Promise<{ ok: true } | { error: string }> {
  const session = await readCampusSession();
  if (!session.authed || !session.isAdmin) {
    return { error: "You must be signed in as an admin." };
  }
  return { ok: true };
}

export async function insertMenuItemFields(input: MenuItemFieldsInput): Promise<MenuItemActionState> {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return { error: admin.error };
  }

  const parsed = parseMenuItemFields(input);

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const priceCents = Math.round(Number.parseFloat(parsed.data.price) * 100);

  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").insert({
    name: parsed.data.name,
    description: parsed.data.description,
    price_cents: priceCents,
    image_url: parsed.data.image_url ?? null,
    is_available: true,
    sort_order: 0,
  });

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
  return { ok: true };
}

export async function updateMenuItemAction(
  itemId: string,
  input: MenuItemFieldsInput
): Promise<MenuItemActionState> {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return { error: admin.error };
  }

  const id = z.string().uuid().safeParse(itemId);
  if (!id.success) {
    return { error: "Invalid item" };
  }

  const parsed = parseMenuItemFields(input);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const priceCents = Math.round(Number.parseFloat(parsed.data.price) * 100);

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      price_cents: priceCents,
      image_url: parsed.data.image_url ?? null,
    })
    .eq("id", id.data);

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
  return { ok: true };
}

export async function setMenuItemAvailabilityAction(
  itemId: string,
  is_available: boolean
): Promise<{ ok?: boolean; error?: string }> {
  const session = await readCampusSession();
  if (!session.authed || !session.isAdmin) {
    return { error: "Forbidden" };
  }

  const id = z.string().uuid().safeParse(itemId);
  if (!id.success) {
    return { error: "Invalid item" };
  }

  const availability = z.boolean().safeParse(is_available);
  if (!availability.success) {
    return { error: "Invalid availability" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ is_available: availability.data })
    .eq("id", id.data);

  if (error) {
    if (error.code === "42501" || /permission denied|row-level security/i.test(error.message)) {
      return { error: "Permission denied. Confirm admin role on your Supabase user." };
    }
    return { error: error.message };
  }

  revalidateMenuPaths();
  return { ok: true };
}

/** Set `is_available = true` on all currently unpublished menu items. */
export async function publishAllMenuItemsAction(): Promise<{
  ok?: boolean;
  error?: string;
  publishedCount?: number;
}> {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return { error: admin.error };
  }

  const supabase = await createClient();
  const { data: unpublished, error: selectError } = await supabase
    .from("menu_items")
    .select("id")
    .eq("is_available", false);

  if (selectError) {
    if (selectError.code === "42501" || /permission denied|row-level security/i.test(selectError.message)) {
      return { error: "Permission denied. Confirm admin role on your Supabase user." };
    }
    return { error: selectError.message };
  }

  const ids = (unpublished ?? []).map((row) => row.id as string);
  if (ids.length === 0) {
    return { ok: true, publishedCount: 0 };
  }

  const { error: updateError } = await supabase
    .from("menu_items")
    .update({ is_available: true })
    .in("id", ids);

  if (updateError) {
    if (updateError.code === "42501" || /permission denied|row-level security/i.test(updateError.message)) {
      return { error: "Permission denied. Confirm admin role on your Supabase user." };
    }
    return { error: updateError.message };
  }

  revalidateMenuPaths();
  return { ok: true, publishedCount: ids.length };
}

/** Form action wrapper for legacy HTML forms (same validation as {@link insertMenuItemFields}). */
export async function createMenuItemAction(
  _prev: MenuItemActionState,
  formData: FormData
): Promise<MenuItemActionState> {
  return insertMenuItemFields({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: String(formData.get("price") ?? ""),
    image_url: String(formData.get("image_url") ?? ""),
  });
}

export async function deleteMenuItemAction(itemId: string): Promise<{ ok?: boolean; error?: string }> {
  const session = await readCampusSession();
  if (!session.authed || !session.isAdmin) {
    return { error: "Forbidden" };
  }

  const id = z.string().uuid().safeParse(itemId);
  if (!id.success) {
    return { error: "Invalid item" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").delete().eq("id", id.data);
  if (error) {
    if (error.code === "42501" || /permission denied|row-level security/i.test(error.message)) {
      return { error: "Permission denied. Confirm admin role on your Supabase user." };
    }
    return { error: error.message };
  }

  revalidateMenuPaths();
  return { ok: true };
}
