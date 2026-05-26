"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { OrderTrackingCard } from "@/components/orders/order-tracking-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/site";
import { formatMenuPrice } from "@/lib/menu/format-price";
import { useOrderRealtime } from "@/lib/orders/use-order-realtime";
import type { Order } from "@/lib/orders/types";

type OrderDetailClientProps = {
  initialOrder: Order;
};

export function OrderDetailClient({ initialOrder }: OrderDetailClientProps) {
  const order = useOrderRealtime(initialOrder.id, initialOrder);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit gap-2">
        <Link href={ROUTES.orders}>
          <ArrowLeft className="size-4" aria-hidden />
          All orders
        </Link>
      </Button>

      <OrderTrackingCard order={order} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border/60">
            {order.items.map((line) => (
              <li key={line.id} className="flex items-center justify-between gap-4 py-3 text-sm first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium text-foreground">{line.name}</p>
                  <p className="text-muted-foreground">
                    {line.quantity} × {formatMenuPrice(line.priceCents)}
                  </p>
                </div>
                <p className="font-semibold tabular-nums">{formatMenuPrice(line.priceCents * line.quantity)}</p>
              </li>
            ))}
          </ul>
          {order.notes ? (
            <p className="mt-4 rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Your notes: </span>
              {order.notes}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
