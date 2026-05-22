"use client";

import { ShoppingCart } from "lucide-react";

import { useCart } from "@/components/menu/cart-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NavbarCartLink() {
  const { totalQuantity, openDrawer } = useCart();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative size-7 shrink-0 text-muted-foreground hover:text-foreground"
      onClick={openDrawer}
      aria-label={totalQuantity > 0 ? `Cart, ${totalQuantity} items` : "Cart"}
    >
      <span>
        <ShoppingCart className="size-4.5" strokeWidth={1.75} aria-hidden />
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[0.625rem] font-bold tabular-nums",
            totalQuantity > 0
              ? "bg-amber-500 text-white shadow-sm dark:bg-amber-400 dark:text-amber-950"
              : "bg-muted text-muted-foreground"
          )}
        >
          {totalQuantity > 99 ? "99+" : totalQuantity}
        </span>
      </span>
    </Button>
  );
}
