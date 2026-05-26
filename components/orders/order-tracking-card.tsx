"use client";

import { AlertCircle, Clock, Store } from "lucide-react";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderStatusStepper } from "@/components/orders/order-status-stepper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SITE } from "@/constants/site";
import { formatMenuPrice } from "@/lib/menu/format-price";
import { ORDER_STATUS_LABELS } from "@/lib/orders/status";
import type { Order } from "@/lib/orders/types";
import { cn } from "@/lib/utils";

function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat(SITE.menu.locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

type OrderTrackingCardProps = {
  order: Order;
  className?: string;
};

export function OrderTrackingCard({ order, className }: OrderTrackingCardProps) {
  const isCancelled = order.status === "cancelled";
  const payAtCounter = order.paymentMethod === "counter";

  return (
    <Card
      className={cn(
        "border-amber-200/80 bg-gradient-to-br from-card to-amber-50/30 dark:border-amber-900/45 dark:to-amber-950/20",
        className
      )}
    >
      <CardHeader className="gap-3 border-b border-border/60">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">{ORDER_STATUS_LABELS[order.status]}</CardTitle>
            <CardDescription className="mt-1">
              Placed {formatOrderDate(order.createdAt)} · Order #{order.id.slice(0, 8)}
            </CardDescription>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        {order.statusMessage ? (
          <Alert>
            <AlertCircle className="size-4" aria-hidden />
            <AlertTitle>Update from the canteen</AlertTitle>
            <AlertDescription>{order.statusMessage}</AlertDescription>
          </Alert>
        ) : null}
        {isCancelled ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" aria-hidden />
            <AlertTitle>Order cancelled</AlertTitle>
            <AlertDescription>
              This order will not be prepared. Contact the canteen if you have questions.
            </AlertDescription>
          </Alert>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {!isCancelled ? <OrderStatusStepper status={order.status} /> : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-4">
            <Store className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
            <div>
              <p className="text-sm font-medium text-foreground">Payment</p>
              <p className="text-sm text-muted-foreground">
                {payAtCounter ? "Pay at the counter when you pick up" : "Online payment"}
              </p>
              <p className="mt-1 text-xs capitalize text-muted-foreground">{order.paymentStatus}</p>
            </div>
          </div>
          {order.estimatedReadyAt ? (
            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-4">
              <Clock className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
              <div>
                <p className="text-sm font-medium text-foreground">Estimated ready</p>
                <p className="text-sm text-muted-foreground">{formatOrderDate(order.estimatedReadyAt)}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between rounded-lg bg-amber-50/80 px-4 py-3 dark:bg-amber-950/30">
          <span className="text-sm font-medium text-muted-foreground">Order total</span>
          <span className="text-lg font-bold tabular-nums text-foreground">{formatMenuPrice(order.totalCents)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
