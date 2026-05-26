import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/orders/status";

export type OrderRow = {
  id: string;
  user_id: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal_cents: number;
  total_cents: number;
  notes: string | null;
  status_message: string | null;
  estimated_ready_at: string | null;
  status_updated_at: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  price_cents: number;
  quantity: number;
  created_at: string;
};

export type OrderItem = {
  id: string;
  menuItemId: string;
  name: string;
  priceCents: number;
  quantity: number;
};

export type Order = {
  id: string;
  userId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotalCents: number;
  totalCents: number;
  notes: string | null;
  statusMessage: string | null;
  estimatedReadyAt: string | null;
  statusUpdatedAt: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

export type PlaceOrderLineInput = {
  menuItemId: string;
  quantity: number;
};

export type PlaceOrderInput = {
  items: PlaceOrderLineInput[];
  paymentMethod: PaymentMethod;
  notes?: string;
};

export type PlaceOrderRazorpayCheckout = {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
};

export type PlaceOrderResult =
  | { ok: true; orderId: string; razorpay?: PlaceOrderRazorpayCheckout }
  | { ok?: false; error?: string; fieldErrors?: Record<string, string> };

/** Admin queue row: order header + item count/summary (no full line items). */
export type AdminOrderSummary = {
  id: string;
  userId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotalCents: number;
  totalCents: number;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  notes: string | null;
  statusMessage: string | null;
  estimatedReadyAt: string | null;
  statusUpdatedAt: string;
  createdAt: string;
  itemCount: number;
  itemSummary: string;
};

export type UpdateOrderStatusResult =
  | { ok: true }
  | { ok?: false; error?: string };
