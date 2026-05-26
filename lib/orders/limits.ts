/** Max units of one menu item per order (cart + checkout). */
export const MAX_QUANTITY_PER_MENU_ITEM = 5;

export const MAX_QUANTITY_PER_MENU_ITEM_MESSAGE =
  "You can order at most 5 of the same item at a time.";

export function isWithinPerItemLimit(quantity: number): boolean {
  return quantity >= 1 && quantity <= MAX_QUANTITY_PER_MENU_ITEM;
}
