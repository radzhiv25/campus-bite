import { createClient } from "@/lib/supabase/server";

import { formatMenuPrice } from "@/lib/menu/format-price";
import type { OrderRow } from "@/lib/orders/types";
import type { OrderStatus, PaymentMethod } from "@/lib/orders/status";

const ANALYTICS_DAYS = 30;
const ANALYTICS_ORDER_LIMIT = 500;

type OrderItemAnalyticsRow = {
  order_id: string;
  name: string;
  quantity: number;
  price_cents: number;
};

export type AdminAnalyticsSummary = {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  revenueCents: number;
  paidOnlineCents: number;
  avgOrderCents: number;
  periodLabel: string;
};

export type AdminAnalyticsStatusRow = {
  status: OrderStatus;
  label: string;
  count: number;
};

export type AdminAnalyticsDayRow = {
  date: string;
  label: string;
  orderCount: number;
  revenueCents: number;
};

export type AdminAnalyticsPaymentRow = {
  method: PaymentMethod;
  label: string;
  count: number;
  revenueCents: number;
};

export type AdminAnalyticsTopItemRow = {
  name: string;
  quantity: number;
  revenueCents: number;
};

export type AdminAnalyticsOrderRow = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  totalCents: number;
  itemCount: number;
};

export type AdminAnalytics = {
  summary: AdminAnalyticsSummary;
  ordersByStatus: AdminAnalyticsStatusRow[];
  revenueByDay: AdminAnalyticsDayRow[];
  paymentBreakdown: AdminAnalyticsPaymentRow[];
  topItems: AdminAnalyticsTopItemRow[];
  recentOrders: AdminAnalyticsOrderRow[];
};

export type AdminAnalyticsResult = {
  data: AdminAnalytics | null;
  error: string | null;
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function formatDayLabel(dateKey: string) {
  const d = new Date(`${dateKey}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function countsTowardRevenue(order: OrderRow) {
  return order.status !== "cancelled";
}

export async function getAdminAnalytics(): Promise<AdminAnalyticsResult> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - ANALYTICS_DAYS);

    const supabase = await createClient();
    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        "id,user_id,status,payment_method,payment_status,subtotal_cents,total_cents,created_at"
      )
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(ANALYTICS_ORDER_LIMIT);

    if (error) {
      return { data: null, error: error.message };
    }

    const rows = (orders ?? []) as OrderRow[];
    if (rows.length === 0) {
      return {
        data: {
          summary: {
            totalOrders: 0,
            activeOrders: 0,
            completedOrders: 0,
            cancelledOrders: 0,
            revenueCents: 0,
            paidOnlineCents: 0,
            avgOrderCents: 0,
            periodLabel: `Last ${ANALYTICS_DAYS} days`,
          },
          ordersByStatus: [],
          revenueByDay: [],
          paymentBreakdown: [],
          topItems: [],
          recentOrders: [],
        },
        error: null,
      };
    }

    const orderIds = rows.map((o) => o.id);
    const { data: itemRows } = await supabase
      .from("order_items")
      .select("order_id,name,quantity,price_cents")
      .in("order_id", orderIds);

    const itemsByOrder = new Map<string, number>();
    const topItemMap = new Map<string, { quantity: number; revenueCents: number }>();

    for (const item of (itemRows ?? []) as OrderItemAnalyticsRow[]) {
      const order = rows.find((o) => o.id === item.order_id);
      if (!order || !countsTowardRevenue(order)) continue;

      itemsByOrder.set(item.order_id, (itemsByOrder.get(item.order_id) ?? 0) + item.quantity);

      const key = item.name;
      const lineRevenue = item.price_cents * item.quantity;
      const prev = topItemMap.get(key) ?? { quantity: 0, revenueCents: 0 };
      topItemMap.set(key, {
        quantity: prev.quantity + item.quantity,
        revenueCents: prev.revenueCents + lineRevenue,
      });
    }

    const statusCounts = new Map<OrderStatus, number>();
    const dayMap = new Map<string, { orderCount: number; revenueCents: number }>();
    const paymentMap = new Map<PaymentMethod, { count: number; revenueCents: number }>();

    let revenueCents = 0;
    let paidOnlineCents = 0;
    let activeOrders = 0;
    let completedOrders = 0;
    let cancelledOrders = 0;

    for (const order of rows) {
      statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1);

      if (order.status === "completed") completedOrders += 1;
      if (order.status === "cancelled") cancelledOrders += 1;
      if (order.status !== "completed" && order.status !== "cancelled") activeOrders += 1;

      if (countsTowardRevenue(order)) {
        revenueCents += order.total_cents;
        if (order.payment_method === "razorpay" && order.payment_status === "paid") {
          paidOnlineCents += order.total_cents;
        }

        const dk = dayKey(order.created_at);
        const day = dayMap.get(dk) ?? { orderCount: 0, revenueCents: 0 };
        dayMap.set(dk, {
          orderCount: day.orderCount + 1,
          revenueCents: day.revenueCents + order.total_cents,
        });

        const pay = paymentMap.get(order.payment_method) ?? { count: 0, revenueCents: 0 };
        paymentMap.set(order.payment_method, {
          count: pay.count + 1,
          revenueCents: pay.revenueCents + order.total_cents,
        });
      }
    }

    const revenueOrders = rows.filter(countsTowardRevenue);
    const avgOrderCents =
      revenueOrders.length > 0 ? Math.round(revenueCents / revenueOrders.length) : 0;

    const ordersByStatus = (Object.keys(STATUS_LABELS) as OrderStatus[])
      .map((status) => ({
        status,
        label: STATUS_LABELS[status],
        count: statusCounts.get(status) ?? 0,
      }))
      .filter((row) => row.count > 0);

    const revenueByDay = [...dayMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        label: formatDayLabel(date),
        orderCount: v.orderCount,
        revenueCents: v.revenueCents,
      }));

    const paymentBreakdown: AdminAnalyticsPaymentRow[] = (
      ["counter", "razorpay"] as PaymentMethod[]
    ).map((method) => ({
      method,
      label: method === "counter" ? "Counter" : "Razorpay",
      count: paymentMap.get(method)?.count ?? 0,
      revenueCents: paymentMap.get(method)?.revenueCents ?? 0,
    }));

    const topItems = [...topItemMap.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenueCents - a.revenueCents)
      .slice(0, 10);

    const recentOrders: AdminAnalyticsOrderRow[] = rows.slice(0, 25).map((order) => ({
      id: order.id,
      createdAt: order.created_at,
      status: order.status,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      totalCents: order.total_cents,
      itemCount: itemsByOrder.get(order.id) ?? 0,
    }));

    return {
      data: {
        summary: {
          totalOrders: rows.length,
          activeOrders,
          completedOrders,
          cancelledOrders,
          revenueCents,
          paidOnlineCents,
          avgOrderCents,
          periodLabel: `Last ${ANALYTICS_DAYS} days`,
        },
        ordersByStatus,
        revenueByDay,
        paymentBreakdown,
        topItems,
        recentOrders,
      },
      error: null,
    };
  } catch {
    return { data: null, error: "Could not load analytics." };
  }
}

/** Format paise as INR string for chart tooltips (server-safe export for client). */
export function formatAnalyticsInr(paise: number) {
  return formatMenuPrice(paise);
}
