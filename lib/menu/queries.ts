import { createClient } from "@/lib/supabase/server";

import { mapMenuItemRow } from "@/lib/menu/map-row";
import type { MenuItem, MenuItemRow } from "@/lib/menu/types";

/** Live menu from Supabase. Returns an empty list if the table is missing or the query fails. */
export async function fetchMenuItems(): Promise<MenuItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("menu_items")
      .select("id,name,description,price_cents,image_url,is_available,sort_order,created_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }
    return data.map((row) => mapMenuItemRow(row as MenuItemRow));
  } catch {
    return [];
  }
}
