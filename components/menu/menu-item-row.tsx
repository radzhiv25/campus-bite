"use client";

import { createElement } from "react";

import { Badge } from "@/components/ui/badge";
import { MenuItemCartControls } from "@/components/menu/menu-item-cart-controls";
import { formatMenuPrice } from "@/lib/menu/format-price";
import { getMenuItemIcon } from "@/lib/menu/item-icons";
import type { MenuItem } from "@/lib/menu/types";
import { cn } from "@/lib/utils";

type MenuItemRowProps = {
  item: MenuItem;
};

export function MenuItemRow({ item }: MenuItemRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border py-4 last:border-b-0",
        !item.is_available && "opacity-80"
      )}
    >
      <div className="flex gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/55 dark:text-amber-300"
          aria-hidden
        >
          {createElement(getMenuItemIcon(item.iconKey), {
            className: "size-[1.15rem]",
            strokeWidth: 1.75,
          })}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          {!item.is_available ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-[0.65rem]">
                Unavailable
              </Badge>
            </div>
          ) : null}
          <p className="font-medium text-foreground">{item.name}</p>
          {item.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
          ) : null}
        </div>
        <p className="shrink-0 text-base font-semibold tabular-nums text-foreground">
          {formatMenuPrice(item.price_cents)}
        </p>
      </div>
      <div className="pl-[2.875rem]">
        <MenuItemCartControls itemId={item.id} disabled={!item.is_available} compact />
      </div>
    </div>
  );
}
