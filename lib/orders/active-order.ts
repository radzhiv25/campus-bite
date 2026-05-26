import type { OrderStatus } from "@/lib/orders/status";

export const ACTIVE_ORDER_STATUSES = ["pending", "confirmed", "preparing", "ready"] as const satisfies readonly OrderStatus[];

export function isActiveOrderStatus(status: OrderStatus): boolean {
  return (ACTIVE_ORDER_STATUSES as readonly string[]).includes(status);
}

export const LAST_ACTIVE_ORDER_STORAGE_KEY = "campus-bite:active-order-id";

export function rememberActiveOrderId(orderId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_ACTIVE_ORDER_STORAGE_KEY, orderId);
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearRememberedActiveOrderId() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LAST_ACTIVE_ORDER_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function readRememberedActiveOrderId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LAST_ACTIVE_ORDER_STORAGE_KEY);
  } catch {
    return null;
  }
}
