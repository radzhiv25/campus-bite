export type MenuItem = {
  id: string;
  category: string;
  name: string;
  description: string;
  price_cents: number;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  /** Key into `getMenuItemIcon` map in `lib/menu/item-icons.tsx`. */
  iconKey?: string;
};
