"use client";

import { useCallback, useEffect, useState } from "react";

import {
  clearRememberedActiveOrderId,
  isActiveOrderStatus,
  readRememberedActiveOrderId,
} from "@/lib/orders/active-order";
import type { Order, OrderItemRow, OrderRow } from "@/lib/orders/types";
import { createClient } from "@/lib/supabase/client";

const ORDER_COLUMNS =
  "id,user_id,status,payment_method,payment_status,subtotal_cents,total_cents,notes,status_message,estimated_ready_at,status_updated_at,razorpay_order_id,razorpay_payment_id,created_at,updated_at";

const ORDER_ITEM_COLUMNS = "id,order_id,menu_item_id,name,price_cents,quantity,created_at";

function mapRow(row: OrderRow, items: OrderItemRow[]): Order {
  return {
    id: row.id,
    userId: row.user_id,
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: items.map((item) => ({
      id: item.id,
      menuItemId: item.menu_item_id,
      name: item.name,
      priceCents: item.price_cents,
      quantity: item.quantity,
    })),
  };
}

async function fetchOrderWithItems(supabase: ReturnType<typeof createClient>, orderId: string) {
  const { data: order, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) return null;

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select(ORDER_ITEM_COLUMNS)
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (itemsError || !items) return null;

  return mapRow(order as OrderRow, items as OrderItemRow[]);
}

/** Latest in-progress order for the signed-in user (client + RLS). */
export function useActiveOrder() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setOrder(null);
        clearRememberedActiveOrderId();
        return;
      }

      const rememberedId = readRememberedActiveOrderId();
      if (rememberedId) {
        const remembered = await fetchOrderWithItems(supabase, rememberedId);
        if (remembered && isActiveOrderStatus(remembered.status)) {
          setOrder(remembered);
          return;
        }
        clearRememberedActiveOrderId();
      }

      const { data: rows, error } = await supabase
        .from("orders")
        .select(ORDER_COLUMNS)
        .eq("user_id", user.id)
        .in("status", ["pending", "confirmed", "preparing", "ready"])
        .order("created_at", { ascending: false })
        .limit(1);

      if (error || !rows?.[0]) {
        setOrder(null);
        return;
      }

      const latest = await fetchOrderWithItems(supabase, rows[0].id);
      setOrder(latest);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!order) return;
    if (!isActiveOrderStatus(order.status)) {
      clearRememberedActiveOrderId();
      setOrder(null);
    }
  }, [order]);

  return { order, loading, refresh, setOrder };
}
