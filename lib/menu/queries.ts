import { MOCK_MENU_ITEMS } from "@/lib/menu/mock-data";
import type { MenuItem } from "@/lib/menu/types";

/** In-app placeholder menu until a database schema is wired up. */
export async function fetchMenuItems(): Promise<MenuItem[]> {
  return [...MOCK_MENU_ITEMS];
}
