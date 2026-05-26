"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Package } from "lucide-react";
import { useEffect, useState } from "react";

import { OrderStatusStepper } from "@/components/orders/order-status-stepper";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { isAdminRoute } from "@/lib/admin/routes";
import { orderDetailPath, ROUTES } from "@/constants/site";
import { formatMenuPrice } from "@/lib/menu/format-price";
import { isActiveOrderStatus } from "@/lib/orders/active-order";
import { ORDER_STATUS_LABELS } from "@/lib/orders/status";
import { useActiveOrder } from "@/lib/orders/use-active-order";
import { useOrderRealtime } from "@/lib/orders/use-order-realtime";
import type { Order } from "@/lib/orders/types";
import { cn } from "@/lib/utils";

function isOrderDetailRoute(pathname: string | null) {
  if (!pathname) return false;
  return pathname.startsWith(`${ROUTES.orders}/`) && pathname !== ROUTES.orders;
}

function OrderTrackingDockContent({
  initialOrder,
  onInactive,
}: {
  initialOrder: Order;
  onInactive: () => void;
}) {
  const order = useOrderRealtime(initialOrder.id, initialOrder);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isActiveOrderStatus(order.status)) {
      onInactive();
    }
  }, [order.status, onInactive]);

  if (!isActiveOrderStatus(order.status)) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "pointer-events-none fixed inset-y-0 right-0 z-40 hidden w-14 sm:flex",
          "items-center justify-center"
        )}
        aria-hidden
      >
        <div className="pointer-events-auto mr-3 max-h-[min(70vh,28rem)] w-12 rounded-xl border border-amber-500/30 bg-card/95 p-1 shadow-lg backdrop-blur-sm dark:border-amber-500/20">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-full min-h-[8rem] w-full flex-col items-center justify-center gap-2 rounded-lg bg-amber-500/10 px-1 py-4 text-amber-950 transition-colors hover:bg-amber-500/20 dark:text-amber-100"
            aria-label="Open order tracking"
          >
            <Package className="size-5 shrink-0" aria-hidden />
            <span
              className="text-[0.625rem] font-semibold uppercase tracking-wide"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              Track order
            </span>
          </button>
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        className="fixed bottom-4 right-4 z-40 gap-2 shadow-lg sm:hidden"
        onClick={() => setOpen(true)}
      >
        <Package className="size-4" aria-hidden />
        {ORDER_STATUS_LABELS[order.status]}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetHeader className="border-b border-border pb-4 text-left">
            <SheetTitle className="text-base">Your order</SheetTitle>
            <SheetDescription>
              #{order.id.slice(0, 8)} · updates live from the canteen
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-lg font-semibold text-foreground">{ORDER_STATUS_LABELS[order.status]}</p>
              <OrderStatusBadge status={order.status} />
            </div>

            {order.statusMessage ? (
              <p className="rounded-lg border border-amber-500/25 bg-amber-50/80 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
                {order.statusMessage}
              </p>
            ) : null}

            <OrderStatusStepper status={order.status} />

            <ul className="space-y-2 text-sm">
              {order.items.map((line) => (
                <li key={line.id} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">
                    {line.quantity}× {line.name}
                  </span>
                  <span className="tabular-nums font-medium">
                    {formatMenuPrice(line.priceCents * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold tabular-nums">{formatMenuPrice(order.totalCents)}</span>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-2 border-t border-border p-6">
            <Button asChild>
              <Link href={orderDetailPath(order.id)} onClick={() => setOpen(false)}>
                Full order details
              </Link>
            </Button>
            <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={() => setOpen(false)}>
              <ChevronLeft className="size-4" aria-hidden />
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function OrderTrackingDock() {
  const pathname = usePathname();
  const { order, loading, refresh } = useActiveOrder();

  if (isAdminRoute(pathname) || isOrderDetailRoute(pathname)) {
    return null;
  }

  if (loading || !order || !isActiveOrderStatus(order.status)) {
    return null;
  }

  return <OrderTrackingDockContent initialOrder={order} onInactive={refresh} />;
}
