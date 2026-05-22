"use client";

import { createElement } from "react";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag } from "lucide-react";

import { useCart } from "@/components/menu/cart-context";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ROUTES } from "@/constants/site";
import { formatMenuPrice } from "@/lib/menu/format-price";
import { getMenuItemIcon } from "@/lib/menu/item-icons";

export function CartDrawer() {
  const {
    lines,
    totalQuantity,
    subtotalCents,
    isDrawerOpen,
    setDrawerOpen,
    addOne,
    removeOne,
    removeLine,
    closeDrawer,
  } = useCart();

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-md">
        <SheetHeader className="space-y-1 border-b border-border/60 px-5 py-4">
          <SheetTitle className="text-base font-semibold">Your cart</SheetTitle>
          <SheetDescription>
            {totalQuantity > 0
              ? `${totalQuantity} ${totalQuantity === 1 ? "item" : "items"} selected`
              : "Add dishes from the menu to start your order."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex h-full flex-col">
          {lines.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                <ShoppingBag className="size-7 text-muted-foreground" aria-hidden />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Your cart is empty</p>
                <p className="text-sm text-muted-foreground">Browse the menu and add items to see them here.</p>
              </div>
              <Button asChild onClick={closeDrawer}>
                <Link href={ROUTES.menu} className="gap-2">
                  Browse menu
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {lines.map(({ item, quantity, lineSubtotalCents }) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border/60 bg-card p-3 shadow-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
                        aria-hidden
                      >
                        {createElement(getMenuItemIcon(item.iconKey), {
                          className: "size-5",
                          strokeWidth: 1.75,
                        })}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatMenuPrice(item.price_cents)} each
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="inline-flex h-9 items-center rounded-md border border-border bg-background/80 p-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-sm"
                          onClick={() => removeOne(item.id)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-4" aria-hidden />
                        </Button>
                        <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
                          {quantity}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-sm"
                          onClick={() => addOne(item.id)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-4" aria-hidden />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums text-foreground">
                          {formatMenuPrice(lineSubtotalCents)}
                        </p>
                        <button
                          type="button"
                          className="text-xs text-destructive hover:underline"
                          onClick={() => removeLine(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-border/60 bg-muted/20 px-4 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-lg font-semibold tabular-nums text-foreground">
                    {formatMenuPrice(subtotalCents)}
                  </span>
                </div>
                <Button disabled className="w-full cursor-not-allowed">
                  Checkout (soon)
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
