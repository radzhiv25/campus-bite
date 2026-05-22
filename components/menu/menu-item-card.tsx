"use client";

import { createElement } from "react";

import { Badge } from "@/components/ui/badge";
import { MenuItemCartControls } from "@/components/menu/menu-item-cart-controls";
import { formatMenuPrice } from "@/lib/menu/format-price";
import { getMenuItemIcon } from "@/lib/menu/item-icons";
import type { MenuItem } from "@/lib/menu/types";
import { cn } from "@/lib/utils";

type MenuItemCardProps = {
  item: MenuItem;
};

export function MenuItemCard({ item }: MenuItemCardProps) {
  const Icon = getMenuItemIcon(item.iconKey);

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm ring-1 ring-transparent transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-border hover:shadow-md hover:ring-border/40",
        !item.is_available && "border-dashed opacity-85 hover:translate-y-0"
      )}
    >
      {item.image_url ? (
        <div className="relative aspect-[4/3] w-full bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element -- external menu photos */}
          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
          {!item.is_available ? (
            <span className="absolute bottom-2 left-2 rounded-md bg-background/90 px-2 py-0.5 text-xs font-medium">
              Unavailable
            </span>
          ) : null}
        </div>
      ) : null}

      <div className={cn("flex flex-1 flex-col", item.image_url ? "p-4 sm:p-5" : "p-4 sm:p-5")}>
        <div className="flex gap-3 border-b border-border/60 pb-3">
          {!item.image_url ? (
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/55 dark:text-amber-300"
              aria-hidden
            >
              {createElement(Icon, {
                className: "size-5",
                strokeWidth: 1.75,
              })}
            </div>
          ) : null}
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="font-semibold tracking-tight text-foreground">{item.name}</h3>
            {!item.is_available && !item.image_url ? (
              <Badge variant="secondary" className="text-[0.65rem]">
                Unavailable
              </Badge>
            ) : null}
          </div>
          <p className="shrink-0 self-start rounded-md bg-muted/60 px-2 py-1 text-base font-semibold tabular-nums text-foreground">
            {formatMenuPrice(item.price_cents)}
          </p>
        </div>
        {item.description ? (
          <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
        ) : null}
        <div className="mt-4 border-t border-border/50 pt-4">
          <MenuItemCartControls itemId={item.id} disabled={!item.is_available} />
        </div>
      </div>
    </article>
  );
}
