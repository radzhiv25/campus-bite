import type { PaymentMethod, PaymentStatus } from "@/lib/orders/status";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  counter: "Pay at counter",
  razorpay: "Razorpay (online)",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  pending: "Payment pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};
