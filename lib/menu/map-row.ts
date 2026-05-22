import type { MenuItem, MenuItemRow } from "@/lib/menu/types";

export function mapMenuItemRow(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    price_cents: row.price_cents,
    image_url: row.image_url,
    is_available: row.is_available,
    sort_order: row.sort_order,
    created_at: row.created_at,
  };
}
