"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AddMenuItemDialog } from "@/components/dashboard/add-menu-item-dialog";
import { EditMenuItemDialog } from "@/components/dashboard/edit-menu-item-dialog";
import { MenuImportDialog } from "@/components/dashboard/menu-import-dialog";
import {
  deleteMenuItemAction,
  publishAllMenuItemsAction,
  setMenuItemAvailabilityAction,
} from "@/lib/menu/actions";
import { formatMenuPrice } from "@/lib/menu/format-price";
import type { MenuItem } from "@/lib/menu/types";
import { Button } from "@/components/ui/button";

type AdminMenuPanelProps = {
  items: MenuItem[];
};

export function AdminMenuPanel({ items }: AdminMenuPanelProps) {
  const router = useRouter();
  const [availabilityPendingId, setAvailabilityPendingId] = useState<string | null>(null);
  const [publishAllPending, setPublishAllPending] = useState(false);
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const unpublishedCount = items.filter((item) => !item.is_available).length;
  const rowActionsDisabled = publishAllPending || availabilityPendingId !== null || deletePendingId !== null;

  async function handleToggleAvailability(item: MenuItem) {
    setActionError(null);
    setAvailabilityPendingId(item.id);
    const result = await setMenuItemAvailabilityAction(item.id, !item.is_available);
    setAvailabilityPendingId(null);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    router.refresh();
  }

  async function handlePublishAll() {
    setActionError(null);
    setPublishAllPending(true);
    const result = await publishAllMenuItemsAction();
    setPublishAllPending(false);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleDelete(itemId: string) {
    setActionError(null);
    setDeletePendingId(itemId);
    const result = await deleteMenuItemAction(itemId);
    setDeletePendingId(null);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-foreground">Menu items</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-muted-foreground">
              Add dishes, edit details, publish or unpublish availability, and remove items you no longer serve.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AddMenuItemDialog />
            <MenuImportDialog />
          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-foreground">Listed items</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-muted-foreground">
              {items.length === 0
                ? "Nothing in the database yet."
                : `${items.length} item${items.length === 1 ? "" : "s"}.`}
              {unpublishedCount > 0 ? (
                <span>
                  {" "}
                  · {unpublishedCount} unpublished
                </span>
              ) : null}
            </p>
          </div>
          {unpublishedCount > 0 ? (
            <Button
              type="button"
              size="sm"
              disabled={rowActionsDisabled}
              onClick={() => void handlePublishAll()}
            >
              {publishAllPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Publishing all…
                </>
              ) : (
                `Publish all (${unpublishedCount})`
              )}
            </Button>
          ) : null}
        </div>

        {actionError ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {actionError}
          </p>
        ) : null}

        {items.length === 0 ? null : (
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
            {items.map((item) => {
              const isAvailabilityLoading = availabilityPendingId === item.id;
              const isPublishAllRow = publishAllPending && !item.is_available;
              const isDeleteLoading = deletePendingId === item.id;

              return (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatMenuPrice(item.price_cents)}
                      <span className="mx-1.5 text-border">·</span>
                      {item.is_available ? (
                        <span className="text-emerald-700 dark:text-emerald-400">Published</span>
                      ) : (
                        <span className="text-amber-700 dark:text-amber-400">Unpublished</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <EditMenuItemDialog
                      item={item}
                      disabled={rowActionsDisabled || isAvailabilityLoading || isDeleteLoading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        publishAllPending ||
                        (availabilityPendingId !== null && !isAvailabilityLoading) ||
                        isDeleteLoading
                      }
                      onClick={() => void handleToggleAvailability(item)}
                    >
                      {isAvailabilityLoading || isPublishAllRow ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                          {item.is_available ? "Unpublishing…" : "Publishing…"}
                        </>
                      ) : item.is_available ? (
                        "Unpublish"
                      ) : (
                        "Publish"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={
                        publishAllPending ||
                        (deletePendingId !== null && !isDeleteLoading) ||
                        isAvailabilityLoading
                      }
                      onClick={() => void handleDelete(item.id)}
                    >
                      {isDeleteLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                          Removing…
                        </>
                      ) : (
                        "Remove"
                      )}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
