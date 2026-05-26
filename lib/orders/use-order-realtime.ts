"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Order, OrderRow } from "@/lib/orders/types";

function applyOrderRowPatch(prev: Order, row: OrderRow): Order {
  return {
    ...prev,
    status: row.status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    subtotalCents: row.subtotal_cents,
    totalCents: row.total_cents,
    notes: row.notes,
    statusMessage: row.status_message,
    estimatedReadyAt: row.estimated_ready_at,
    statusUpdatedAt: row.status_updated_at,
    razorpayOrderId: row.razorpay_order_id,
    razorpayPaymentId: row.razorpay_payment_id,
    updatedAt: row.updated_at,
  };
}

/**
 * Subscribe to live updates for a single order row (requires Realtime on public.orders).
 */
export function useOrderRealtime(orderId: string, initialOrder: Order): Order {
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  useEffect(() => {
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    const channel = supabase
      .channel(`order:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const row = payload.new as OrderRow;
          setOrder((prev) => applyOrderRowPatch(prev, row));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [orderId]);

  return order;
}
