"use client";

import { ThemeProvider } from "next-themes";

import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartProvider } from "@/components/menu/cart-context";
import { OrderTrackingDock } from "@/components/orders/order-tracking-dock";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <CartProvider>
        <TooltipProvider>
          {children}
          <CartDrawer />
          <OrderTrackingDock />
          <Toaster />
        </TooltipProvider>
      </CartProvider>
    </ThemeProvider>
  );
}
