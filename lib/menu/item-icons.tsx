import type { LucideIcon } from "lucide-react";
import {
  Apple,
  Bean,
  Candy,
  Citrus,
  Coffee,
  Cookie,
  Croissant,
  CupSoda,
  Drumstick,
  GlassWater,
  Grape,
  Hamburger,
  IceCream,
  Milk,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
  Wheat,
} from "lucide-react";

const MENU_ITEM_ICON_MAP: Record<string, LucideIcon> = {
  wrap: Sandwich,
  oats: Wheat,
  toast: Croissant,
  bowl: Salad,
  sandwich: Sandwich,
  pasta: Soup,
  chicken: Drumstick,
  burger: Hamburger,
  soup: Soup,
  fruit: Apple,
  hummus: Bean,
  trail: Candy,
  parfait: Milk,
  pretzel: Wheat,
  coldbrew: Coffee,
  lemonade: CupSoda,
  water: GlassWater,
  chai: Citrus,
  smoothie: Grape,
  brownie: Cookie,
  cookie: Cookie,
  tart: Pizza,
  yogurt: IceCream,
};

export function getMenuItemIcon(iconKey: string | undefined): LucideIcon {
  if (iconKey && MENU_ITEM_ICON_MAP[iconKey]) {
    return MENU_ITEM_ICON_MAP[iconKey];
  }
  return UtensilsCrossed;
}
