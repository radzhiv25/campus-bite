"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { AddMenuItemDialog } from "@/components/dashboard/add-menu-item-dialog";
import { deleteMenuItemAction } from "@/lib/menu/actions";
import { formatMenuPrice } from "@/lib/menu/format-price";
import type { MenuItem } from "@/lib/menu/types";
import { Button } from "@/components/ui/button";

type AdminMenuPanelProps = {
  items: MenuItem[];
};

export function AdminMenuPanel({ items }: AdminMenuPanelProps) {
  const router = useRouter();
  const [isDeleting, startTransition] = useTransition();

  return (
    <div className="space-y-10">
      <section>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-foreground">Menu items</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-muted-foreground">
              Add dishes in the dialog; they show on the public menu right away. Remove lines you no longer serve.
            </p>
          </div>
          <AddMenuItemDialog />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-foreground">Listed items</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-muted-foreground">
          {items.length === 0 ? "Nothing in the database yet." : `${items.length} item${items.length === 1 ? "" : "s"}.`}
        </p>
        {items.length === 0 ? null : (
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{formatMenuPrice(item.price_cents)}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={isDeleting}
                  onClick={() => {
                    startTransition(async () => {
                      await deleteMenuItemAction(item.id);
                      router.refresh();
                    });
                  }}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
