export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  /** Public HTTPS URL (e.g. Supabase Storage or CDN). */
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  category?: string;
  /** Key into `getMenuItemIcon` map in `lib/menu/item-icons.tsx`. */
  iconKey?: string;
};

export type MenuItemRow = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
};
