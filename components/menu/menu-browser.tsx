import { MenuItemCard } from "@/components/menu/menu-item-card";
import type { MenuItem } from "@/lib/menu/types";

type MenuBrowserProps = {
  items: MenuItem[];
};

export function MenuBrowser({ items }: MenuBrowserProps) {
  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm font-medium text-foreground">No dishes yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          When an admin adds menu items in the dashboard, they will show up here.
        </p>
      </section>
    );
  }

  return (
    <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.id} className="min-h-0">
          <MenuItemCard item={item} />
        </li>
      ))}
    </ul>
  );
}
