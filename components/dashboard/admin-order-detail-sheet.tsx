"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, Store } from "lucide-react";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderStatusStepper } from "@/components/orders/order-status-stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SITE } from "@/constants/site";
import { formatMenuPrice } from "@/lib/menu/format-price";
import { fetchAdminOrderDetailAction, updateOrderStatusAction } from "@/lib/orders/actions";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/orders/payment-labels";
import {
  canTransitionOrderStatus,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/orders/status";
import type { Order } from "@/lib/orders/types";
import { useOrderRealtime } from "@/lib/orders/use-order-realtime";

type AdminOrderDetailSheetProps = {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(SITE.menu.locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function addMinutesIso(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function isTerminalStatus(status: OrderStatus) {
  return status === "completed" || status === "cancelled";
}

function AdminOrderDetailBody({
  initialOrder,
  onUpdated,
}: {
  initialOrder: Order;
  onUpdated: () => void;
}) {
  const router = useRouter();
  const order = useOrderRealtime(initialOrder.id, initialOrder);
  const [message, setMessage] = useState(order.statusMessage ?? "");
  const [etaIso, setEtaIso] = useState<string | null>(order.estimatedReadyAt);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isHistory = isTerminalStatus(order.status);

  useEffect(() => {
    setMessage(order.statusMessage ?? "");
    setEtaIso(order.estimatedReadyAt);
  }, [order.statusMessage, order.estimatedReadyAt, order.id]);

  function applyStatus(nextStatus: OrderStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatusAction(order.id, nextStatus, {
        ...(etaIso ? { estimatedReadyAt: etaIso } : {}),
        ...(message.trim() ? { statusMessage: message.trim() } : {}),
      });
      if (!("ok" in result) || !result.ok) {
        setError("error" in result && result.error ? result.error : "Could not update order.");
        return;
      }
      onUpdated();
      router.refresh();
    });
  }

  const actions: { label: string; status: OrderStatus; variant?: "default" | "outline" | "destructive" }[] =
    [];
  if (canTransitionOrderStatus(order.status, "confirmed")) {
    actions.push({ label: "Confirm", status: "confirmed" });
  }
  if (canTransitionOrderStatus(order.status, "preparing")) {
    actions.push({ label: "Preparing", status: "preparing" });
  }
  if (canTransitionOrderStatus(order.status, "ready")) {
    actions.push({ label: "Ready", status: "ready" });
  }
  if (canTransitionOrderStatus(order.status, "completed")) {
    actions.push({ label: "Complete", status: "completed", variant: "default" });
  }
  if (canTransitionOrderStatus(order.status, "cancelled")) {
    actions.push({ label: "Cancel", status: "cancelled", variant: "destructive" });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 pb-6">
      <div className="flex flex-wrap items-center gap-2">
        <OrderStatusBadge status={order.status} />
        <Badge variant="outline">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</Badge>
        <Badge
          variant={
            order.paymentStatus === "paid"
              ? "default"
              : order.paymentStatus === "failed"
                ? "destructive"
                : "secondary"
          }
        >
          {PAYMENT_STATUS_LABELS[order.paymentStatus]}
        </Badge>
      </div>

      {!isHistory ? <OrderStatusStepper status={order.status} /> : null}

      <section className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
        <h3 className="text-sm font-semibold text-foreground">Payment</h3>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Method</dt>
            <dd className="font-medium">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium capitalize">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums font-medium">{formatMenuPrice(order.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Total</dt>
            <dd className="tabular-nums font-semibold">{formatMenuPrice(order.totalCents)}</dd>
          </div>
          {order.paymentMethod === "razorpay" ? (
            <>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Razorpay order</dt>
                <dd className="max-w-[12rem] truncate font-mono text-xs">
                  {order.razorpayOrderId ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Razorpay payment</dt>
                <dd className="max-w-[12rem] truncate font-mono text-xs">
                  {order.razorpayPaymentId ?? "—"}
                </dd>
              </div>
            </>
          ) : (
            <div className="flex items-start gap-2 text-muted-foreground">
              <Store className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p className="text-xs">Customer pays at the counter when picking up.</p>
            </div>
          )}
          {order.paymentMethod === "razorpay" ? (
            <div className="flex items-start gap-2 text-muted-foreground">
              <CreditCard className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p className="text-xs">Online payment via Razorpay checkout.</p>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Line items</h3>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {order.items.map((line) => (
            <li key={line.id} className="flex justify-between gap-3 px-3 py-2.5 text-sm">
              <div>
                <p className="font-medium">{line.name}</p>
                <p className="text-muted-foreground">
                  {line.quantity} × {formatMenuPrice(line.priceCents)}
                </p>
              </div>
              <p className="shrink-0 font-semibold tabular-nums">
                {formatMenuPrice(line.priceCents * line.quantity)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2 text-sm">
        <h3 className="font-semibold text-foreground">Order meta</h3>
        <p className="text-muted-foreground">
          Placed {formatWhen(order.createdAt)} · Updated {formatWhen(order.statusUpdatedAt)}
        </p>
        <p className="font-mono text-xs text-muted-foreground">Order {order.id}</p>
        <p className="font-mono text-xs text-muted-foreground">Customer {order.userId}</p>
        {order.notes ? (
          <p className="rounded-lg bg-muted/40 px-3 py-2">
            <span className="font-medium text-foreground">Customer note: </span>
            {order.notes}
          </p>
        ) : null}
        {order.statusMessage ? (
          <p className="rounded-lg border border-amber-500/25 bg-amber-50/80 px-3 py-2 dark:bg-amber-950/30">
            <span className="font-medium">Message to student: </span>
            {order.statusMessage}
          </p>
        ) : null}
        {order.estimatedReadyAt ? (
          <p className="text-muted-foreground">ETA: {formatWhen(order.estimatedReadyAt)}</p>
        ) : null}
      </section>

      {!isHistory ? (
        <section className="space-y-4 border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-foreground">Update order</h3>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="admin-order-eta">
              ETA for student
            </label>
            <p className="text-sm">{formatWhen(etaIso)}</p>
            <div className="flex flex-wrap gap-1">
              {[10, 15, 20].map((min) => (
                <Button
                  key={min}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  disabled={isPending}
                  onClick={() => setEtaIso(addMinutesIso(min))}
                >
                  +{min}m
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="admin-order-msg">
              Message to student
            </label>
            <Input
              id="admin-order-msg"
              value={message}
              disabled={isPending}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Optional update"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button
                key={action.status}
                type="button"
                size="sm"
                variant={action.variant ?? "outline"}
                disabled={isPending}
                onClick={() => applyStatus(action.status)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </section>
      ) : (
        <p className="border-t border-border pt-4 text-xs text-muted-foreground">
          This order is closed ({ORDER_STATUS_LABELS[order.status].toLowerCase()}).
        </p>
      )}
    </div>
  );
}

export function AdminOrderDetailSheet({ orderId, open, onOpenChange }: AdminOrderDetailSheetProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !orderId) {
      setOrder(null);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    void fetchAdminOrderDetailAction(orderId).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (result.order) {
        setOrder(result.order);
        setLoadError(null);
      } else {
        setOrder(null);
        setLoadError(result.error ?? "Could not load order.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, orderId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-6 py-5 text-left">
          <SheetTitle className="text-base">Order details</SheetTitle>
          <SheetDescription>
            {orderId ? `#${orderId.slice(0, 8)}` : "Select an order"} · payment, items, and status
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            Loading order…
          </div>
        ) : loadError ? (
          <p className="px-6 py-8 text-sm text-destructive">{loadError}</p>
        ) : order ? (
          <AdminOrderDetailBody
            initialOrder={order}
            onUpdated={() => {
              router.refresh();
              void fetchAdminOrderDetailAction(order.id).then((r) => {
                if (r.order) setOrder(r.order);
              });
            }}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
