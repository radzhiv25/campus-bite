import { createClient } from "@/lib/supabase/server";

import type {
  AdminOrderSummary,
  Order,
  OrderItem,
  OrderItemRow,
  OrderRow,
} from "@/lib/orders/types";

const ORDER_COLUMNS =
  "id,user_id,status,payment_method,payment_status,subtotal_cents,total_cents,notes,status_message,estimated_ready_at,status_updated_at,razorpay_order_id,razorpay_payment_id,created_at,updated_at";

const ORDER_ITEM_COLUMNS = "id,order_id,menu_item_id,name,price_cents,quantity,created_at";

function mapOrderItemRow(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    menuItemId: row.menu_item_id,
    name: row.name,
    priceCents: row.price_cents,
    quantity: row.quantity,
  };
}

function mapOrderRow(row: OrderRow, items: OrderItem[]): Order {
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
    items,
  };
}

/** Fetch one order with line items. RLS limits to own orders (or admin). */
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const supabase = await createClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select(ORDER_COLUMNS)
      .eq("id", orderId)
      .maybeSingle();

    if (error || !order) {
      return null;
    }

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select(ORDER_ITEM_COLUMNS)
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (itemsError || !items) {
      return null;
    }

    return mapOrderRow(order as OrderRow, items.map((row) => mapOrderItemRow(row as OrderItemRow)));
  } catch {
    return null;
  }
}

/** List orders for the signed-in user, newest first. */
export async function listOrdersForUser(): Promise<Order[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select(ORDER_COLUMNS)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !orders?.length) {
      return [];
    }

    const orderIds = orders.map((o) => o.id);
    const { data: allItems, error: itemsError } = await supabase
      .from("order_items")
      .select(ORDER_ITEM_COLUMNS)
      .in("order_id", orderIds)
      .order("created_at", { ascending: true });

    if (itemsError) {
      return [];
    }

    const itemsByOrder = new Map<string, OrderItem[]>();
    for (const row of allItems ?? []) {
      const item = mapOrderItemRow(row as OrderItemRow);
      const list = itemsByOrder.get(row.order_id) ?? [];
      list.push(item);
      itemsByOrder.set(row.order_id, list);
    }

    return orders.map((row) =>
      mapOrderRow(row as OrderRow, itemsByOrder.get(row.id) ?? [])
    );
  } catch {
    return [];
  }
}

type OrderItemSummaryRow = {
  order_id: string;
  name: string;
  quantity: number;
};

function mapAdminOrderRow(
  row: OrderRow,
  items: { name: string; quantity: number }[]
): AdminOrderSummary {
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const itemSummary =
    items.length === 0
      ? "—"
      : items.map((i) => `${i.quantity}× ${i.name}`).join(", ");

  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    subtotalCents: row.subtotal_cents,
    totalCents: row.total_cents,
    razorpayOrderId: row.razorpay_order_id,
    razorpayPaymentId: row.razorpay_payment_id,
    notes: row.notes,
    statusMessage: row.status_message,
    estimatedReadyAt: row.estimated_ready_at,
    statusUpdatedAt: row.status_updated_at,
    createdAt: row.created_at,
    itemCount,
    itemSummary,
  };
}

export type AdminOrdersQueryResult = {
  orders: AdminOrderSummary[];
  error: string | null;
};

/** Default cap when loading admin order history (newest first). */
export const ADMIN_ORDERS_LIST_LIMIT = 200;

/**
 * List orders for the admin queue (newest first). Requires admin via RLS (JWT or profiles.role).
 * @param activeOnly When true, excludes completed and cancelled (live queue only).
 * @param limit Max rows returned, newest first (default {@link ADMIN_ORDERS_LIST_LIMIT}).
 */
export async function listAllOrdersForAdmin(options?: {
  activeOnly?: boolean;
  limit?: number;
}): Promise<AdminOrdersQueryResult> {
  const activeOnly = options?.activeOnly ?? false;
  const limit = options?.limit ?? ADMIN_ORDERS_LIST_LIMIT;

  try {
    const supabase = await createClient();
    let query = supabase
      .from("orders")
      .select(ORDER_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (activeOnly) {
      query = query.in("status", ["pending", "confirmed", "preparing", "ready"]);
    }

    const { data: orders, error } = await query;

    if (error) {
      if (error.code === "42501" || /permission denied|row-level security/i.test(error.message)) {
        return {
          orders: [],
          error:
            "Cannot read orders. Run supabase/sql/orders.sql (or patch-is-admin-jwt-profiles.sql), set your user as admin (app_metadata.role or profiles.role), then sign out and in.",
        };
      }
      if (error.code === "42P01" || /relation .* does not exist/i.test(error.message)) {
        return {
          orders: [],
          error: "Orders tables are missing. Run supabase/sql/orders.sql in the Supabase SQL editor.",
        };
      }
      return { orders: [], error: error.message };
    }

    if (!orders?.length) {
      return { orders: [], error: null };
    }

    const orderIds = orders.map((o) => o.id);
    const { data: allItems, error: itemsError } = await supabase
      .from("order_items")
      .select("order_id,name,quantity")
      .in("order_id", orderIds)
      .order("created_at", { ascending: true });

    const itemsByOrder = new Map<string, { name: string; quantity: number }[]>();
    if (!itemsError) {
      for (const row of (allItems ?? []) as OrderItemSummaryRow[]) {
        const list = itemsByOrder.get(row.order_id) ?? [];
        list.push({ name: row.name, quantity: row.quantity });
        itemsByOrder.set(row.order_id, list);
      }
    }

    const summaries = orders.map((row) =>
      mapAdminOrderRow(row as OrderRow, itemsByOrder.get(row.id) ?? [])
    );

    return {
      orders: summaries,
      error: itemsError
        ? "Orders loaded but line items were blocked by RLS. Re-apply supabase/sql/orders.sql."
        : null,
    };
  } catch {
    return { orders: [], error: "Could not load orders. Check Supabase connection and try again." };
  }
}

