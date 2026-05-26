"use client";

import { createElement } from "react";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag } from "lucide-react";

import { useCart } from "@/components/menu/cart-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/site";
import { formatMenuPrice } from "@/lib/menu/format-price";
import { getMenuItemIcon } from "@/lib/menu/item-icons";

type CartPageViewProps = {
  authed?: boolean;
};

function checkoutHref(authed: boolean) {
  if (authed) {
    return ROUTES.checkout;
  }
  return `${ROUTES.login}?from=${encodeURIComponent(ROUTES.checkout)}`;
}

export function CartPageView({ authed = false }: CartPageViewProps) {
  const { lines, addOne, canAddMore, removeOne, removeLine, totalQuantity, subtotalCents } = useCart();

  if (lines.length === 0) {
    return (
      <Card className="mx-auto max-w-lg border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted">
            <ShoppingBag className="size-7 text-muted-foreground" aria-hidden />
          </div>
          <CardTitle className="pt-2">Your cart is empty</CardTitle>
          <CardDescription>Add dishes from the menu — they will show up here with quantity and totals.</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center pb-6">
          <Button asChild>
            <Link href={ROUTES.menu} className="gap-2">
              Browse menu
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        {lines.map(({ item, quantity, lineSubtotalCents }) => (
          <Card
            key={item.id}
            className="overflow-hidden border-2 border-amber-200/80 bg-gradient-to-br from-card to-amber-50/40 shadow-md ring-1 ring-amber-500/15 dark:border-amber-900/50 dark:from-card dark:to-amber-950/25 dark:ring-amber-400/10"
          >
            <CardHeader className="border-b border-border/60 bg-muted/25 pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div
                  className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
                  aria-hidden
                >
                  {createElement(getMenuItemIcon(item.iconKey), {
                    className: "size-8",
                    strokeWidth: 1.5,
                  })}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  {!item.is_available ? (
                    <Badge variant="secondary" className="text-[0.65rem]">
                      Unavailable
                    </Badge>
                  ) : null}
                  <CardTitle className="text-xl font-semibold tracking-tight sm:text-2xl">{item.name}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-pretty sm:text-base">
                    {item.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{formatMenuPrice(item.price_cents)}</span> each
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex h-10 items-center rounded-lg border border-border bg-background/80 p-0.5 shadow-sm">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-md"
                    onClick={() => removeOne(item.id)}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="size-4" aria-hidden />
                  </Button>
                  <span className="flex min-w-10 items-center justify-center text-base font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-md"
                    disabled={!canAddMore(item.id)}
                    onClick={() => addOne(item.id)}
                    aria-label="Increase quantity"
                  >
                    <Plus className="size-4" aria-hidden />
                  </Button>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Line total</p>
                  <p className="text-lg font-bold tabular-nums text-foreground">{formatMenuPrice(lineSubtotalCents)}</p>
                </div>
                <Button type="button" variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => removeLine(item.id)}>
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-amber-200/80 bg-amber-50/50 dark:border-amber-900/45 dark:bg-amber-950/30">
        <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Order summary</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{formatMenuPrice(subtotalCents)}</p>
            <p className="text-xs text-muted-foreground">
              {totalQuantity} {totalQuantity === 1 ? "item" : "items"} in your cart
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={ROUTES.menu}>Add more items</Link>
            </Button>
            <Button asChild>
              <Link href={checkoutHref(authed)} className="gap-2">
                Checkout
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
