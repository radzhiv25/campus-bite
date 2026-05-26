"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { AdminOrderDetailSheet } from "@/components/dashboard/admin-order-detail-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMenuPrice } from "@/lib/menu/format-price";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/orders/payment-labels";
import { updateOrderStatusAction } from "@/lib/orders/actions";
import {
  canTransitionOrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/lib/orders/status";
import type { AdminOrderSummary } from "@/lib/orders/types";
import { createClient } from "@/lib/supabase/client";

type StatusFilter = "active" | "history" | "all" | OrderStatus;

function isTerminalStatus(status: OrderStatus) {
  return status === "completed" || status === "cancelled";
}

type OrdersPanelProps = {
  initialOrders: AdminOrderSummary[];
};

const STATUS_BADGE_VARIANT: Record<
  OrderStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "secondary",
  confirmed: "default",
  preparing: "default",
  ready: "default",
  completed: "outline",
  cancelled: "destructive",
};

function shortId(id: string) {
  return id.slice(0, 8);
}

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function addMinutesIso(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

type QuickAction = {
  label: string;
  status: OrderStatus;
  variant?: "default" | "outline" | "destructive";
};

function quickActionsFor(status: OrderStatus): QuickAction[] {
  const actions: QuickAction[] = [];
  if (canTransitionOrderStatus(status, "confirmed")) {
    actions.push({ label: "Confirm", status: "confirmed" });
  }
  if (canTransitionOrderStatus(status, "preparing")) {
    actions.push({ label: "Preparing", status: "preparing" });
  }
  if (canTransitionOrderStatus(status, "ready")) {
    actions.push({ label: "Ready", status: "ready" });
  }
  if (canTransitionOrderStatus(status, "completed")) {
    actions.push({ label: "Complete", status: "completed", variant: "default" });
  }
  if (canTransitionOrderStatus(status, "cancelled")) {
    actions.push({ label: "Cancel", status: "cancelled", variant: "destructive" });
  }
  return actions;
}

function showEtaPresets(status: OrderStatus) {
  return status === "confirmed" || status === "preparing" || status === "ready";
}

export function OrdersPanel({ initialOrders }: OrdersPanelProps) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [etaByOrder, setEtaByOrder] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    if (statusFilter === "active") {
      return orders.filter((o) => !isTerminalStatus(o.status));
    }
    if (statusFilter === "history") {
      return orders.filter((o) => isTerminalStatus(o.status));
    }
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const applyStatus = useCallback(
    (order: AdminOrderSummary, nextStatus: OrderStatus) => {
      setError(null);
      startTransition(async () => {
        const result = await updateOrderStatusAction(order.id, nextStatus, {
          ...(etaByOrder[order.id] ? { estimatedReadyAt: etaByOrder[order.id] } : {}),
          ...(messages[order.id] ? { statusMessage: messages[order.id] } : {}),
        });
        if (!("ok" in result) || !result.ok) {
          setError("error" in result && result.error ? result.error : "Could not update order.");
          return;
        }
        setEtaByOrder((prev) => {
          const next = { ...prev };
          delete next[order.id];
          return next;
        });
        router.refresh();
      });
    },
    [etaByOrder, messages, router]
  );

  return (
    <div className="space-y-6">
      <AdminOrderDetailSheet
        orderId={detailOrderId}
        open={detailOrderId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailOrderId(null);
        }}
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {filteredOrders.length} order{filteredOrders.length === 1 ? "" : "s"}
          {statusFilter === "active"
            ? " in the active queue"
            : statusFilter === "history"
              ? " in history"
              : ""}
          .
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground" id="order-status-filter-label">
            Filter
          </span>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger
              id="order-status-filter"
              size="sm"
              className="w-44"
              aria-labelledby="order-status-filter-label"
            >
              <SelectValue placeholder="Filter orders" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="active">Active queue</SelectItem>
              <SelectItem value="history">History</SelectItem>
              <SelectItem value="all">All orders</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => router.refresh()}
          >
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {filteredOrders.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {statusFilter === "history"
            ? "No completed or cancelled orders yet. Finished orders appear here after you mark them complete or cancel."
            : statusFilter === "active"
              ? "No active orders. New student checkouts appear as pending."
              : "No orders match this filter."}
        </p>
      ) : (
        <ul className="grid gap-4">
          {filteredOrders.map((order) => {
            const actions = quickActionsFor(order.status);
            const etaDisplay = etaByOrder[order.id] ?? order.estimatedReadyAt;
            const isHistory = isTerminalStatus(order.status);

            return (
              <li
                key={order.id}
                className="rounded-xl border border-border bg-background/80 p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={STATUS_BADGE_VARIANT[order.status]}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                      <Badge variant="outline" className="text-[0.625rem]">
                        {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                      </Badge>
                      <Badge
                        variant={
                          order.paymentStatus === "paid"
                            ? "default"
                            : order.paymentStatus === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                        className="text-[0.625rem]"
                      >
                        {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                      </Badge>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {formatMenuPrice(order.totalCents)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{formatWhen(order.createdAt)}</p>
                    <p className="text-xs text-muted-foreground">
                      #{shortId(order.id)} · customer {shortId(order.userId)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailOrderId(order.id)}
                  >
                    Details
                  </Button>
                </div>

                <div className="mt-3 text-sm">
                  <p className="font-medium text-foreground">
                    {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">{order.itemSummary}</p>
                  {order.notes ? (
                    <p className="mt-1 text-xs italic text-muted-foreground">Note: {order.notes}</p>
                  ) : null}
                  {order.statusMessage ? (
                    <p className="mt-1 text-xs text-muted-foreground">Message: {order.statusMessage}</p>
                  ) : null}
                </div>

                {!isHistory ? (
                  <>
                    <div className="mt-4 grid gap-4 border-t border-border/60 pt-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">ETA for student</p>
                        <p className="text-sm">{formatWhen(etaDisplay)}</p>
                        {showEtaPresets(order.status) ? (
                          <div className="flex flex-wrap gap-1">
                            {[10, 15, 20].map((min) => (
                              <Button
                                key={min}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                disabled={isPending}
                                onClick={() =>
                                  setEtaByOrder((prev) => ({
                                    ...prev,
                                    [order.id]: addMinutesIso(min),
                                  }))
                                }
                              >
                                +{min}m
                              </Button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <label
                          className="text-xs font-medium text-muted-foreground"
                          htmlFor={`order-msg-${order.id}`}
                        >
                          Message to student
                        </label>
                        <Input
                          id={`order-msg-${order.id}`}
                          className="h-8 text-sm"
                          placeholder="Optional update"
                          value={messages[order.id] ?? ""}
                          disabled={isPending}
                          onChange={(e) =>
                            setMessages((prev) => ({ ...prev, [order.id]: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {actions.map((action) => (
                        <Button
                          key={action.status}
                          type="button"
                          size="sm"
                          variant={action.variant ?? "outline"}
                          disabled={isPending}
                          onClick={() => applyStatus(order, action.status)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4">
                    <p className="text-xs text-muted-foreground">
                      Closed order — last updated {formatWhen(order.statusUpdatedAt)}.
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => setDetailOrderId(order.id)}
                    >
                      View full details
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
