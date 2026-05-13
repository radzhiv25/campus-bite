"use client";

import { Minus, Plus, ShoppingCart } from "lucide-react";

import { useCart } from "@/components/menu/cart-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MenuItemCartControlsProps = {
  itemId: string;
  disabled?: boolean;
  /** Tighter layout for list rows */
  compact?: boolean;
};

export function MenuItemCartControls({ itemId, disabled, compact }: MenuItemCartControlsProps) {
  const { quantity, addOne, removeOne } = useCart();
  const q = quantity(itemId);

  if (disabled) {
    return (
      <p className="text-xs text-muted-foreground">Not available to order</p>
    );
  }

  if (q === 0) {
    return (
      <Button
        type="button"
        size={compact ? "sm" : "default"}
        className={cn("gap-2", compact && "h-8 text-xs")}
        onClick={() => addOne(itemId)}
      >
        <ShoppingCart className="size-4 shrink-0" aria-hidden />
        Add to cart
      </Button>
    );
  }

  return (
    <div
      className="inline-flex h-9 items-center rounded-lg border border-border bg-muted/40 p-0.5"
      role="group"
      aria-label="Quantity in cart"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 rounded-md"
        onClick={() => removeOne(itemId)}
        aria-label="Remove one from cart"
      >
        <Minus className="size-4" aria-hidden />
      </Button>
      <span className="flex min-w-9 items-center justify-center text-sm font-semibold tabular-nums text-foreground">
        {q}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 rounded-md"
        onClick={() => addOne(itemId)}
        aria-label="Add one more to cart"
      >
        <Plus className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
