export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["counter", "razorpay"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Student-facing headlines for order tracking UI. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Order received",
  confirmed: "Order confirmed",
  preparing: "Being prepared",
  ready: "Ready for pickup",
  completed: "Picked up",
  cancelled: "Order cancelled",
};

/**
 * Allowed admin status transitions (Phase 3). Terminal states have no outgoing edges.
 * @see orders_admin_payments plan state diagram
 */
export const ORDER_STATUS_ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_ALLOWED_TRANSITIONS[from].includes(to);
}

/** Linear pickup flow shown in the student tracking stepper (excludes cancelled). */
export const ORDER_TRACKING_STEPS = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
] as const satisfies readonly OrderStatus[];

export function trackingStepIndex(status: OrderStatus): number {
  if (status === "cancelled") return -1;
  const idx = ORDER_TRACKING_STEPS.indexOf(status as (typeof ORDER_TRACKING_STEPS)[number]);
  return idx >= 0 ? idx : 0;
}
