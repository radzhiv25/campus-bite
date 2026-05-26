"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  MAX_QUANTITY_PER_MENU_ITEM,
  MAX_QUANTITY_PER_MENU_ITEM_MESSAGE,
} from "@/lib/orders/limits";
import {
  canTransitionOrderStatus,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/lib/orders/status";
import type {
  PlaceOrderInput,
  PlaceOrderRazorpayCheckout,
  PlaceOrderResult,
  UpdateOrderStatusResult,
} from "@/lib/orders/types";
import {
  createRazorpayOrder,
  getRazorpayCredentials,
} from "@/lib/payments/razorpay";
import { getOrderById } from "@/lib/orders/queries";
import type { Order } from "@/lib/orders/types";
import { createClient } from "@/lib/supabase/server";
import { readCampusSession } from "@/lib/session";

const lineSchema = z.object({
  menuItemId: z.string().uuid("Invalid menu item"),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(MAX_QUANTITY_PER_MENU_ITEM, MAX_QUANTITY_PER_MENU_ITEM_MESSAGE),
});

const placeOrderSchema = z.object({
  items: z.array(lineSchema).min(1, "Add at least one item"),
  paymentMethod: z.enum(["counter", "razorpay"]),
  notes: z
    .string()
    .max(500, "Notes must be 500 characters or fewer")
    .optional()
    .transform((s) => {
      const trimmed = s?.trim();
      return trimmed === "" ? undefined : trimmed;
    }),
});

type MenuRowForOrder = {
  id: string;
  name: string;
  price_cents: number;
  is_available: boolean;
};

function dbErrorMessage(error: { code?: string; message: string }): string {
  if (error.code === "42501" || /permission denied|row-level security/i.test(error.message)) {
    return "Could not place order. Sign in and ensure orders policies are applied in Supabase.";
  }
  if (error.code === "42P01" || /relation .* does not exist/i.test(error.message)) {
    return "Orders tables are missing. Run supabase/sql/orders.sql in the Supabase SQL editor.";
  }
  return error.message;
}

/**
 * Place an order (pay at counter or Razorpay). Re-fetches menu prices and availability server-side.
 */
export async function placeOrderAction(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const session = await readCampusSession();
  if (!session.authed || !session.userId) {
    return { error: "Sign in to place an order." };
  }

  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    const itemsErr = flat.items?.[0];
    if (itemsErr) fieldErrors.items = itemsErr;
    const notesErr = flat.notes?.[0];
    if (notesErr) fieldErrors.notes = notesErr;
    if (Object.keys(fieldErrors).length > 0) {
      return { fieldErrors };
    }
    return { error: "Invalid order." };
  }

  const { items, paymentMethod, notes } = parsed.data;

  if (paymentMethod === "razorpay" && !getRazorpayCredentials()) {
    return { error: "Online payment is not available right now. Pay at the counter instead." };
  }

  const uniqueIds = [...new Set(items.map((i) => i.menuItemId))];
  const qtyByMenuId = new Map<string, number>();
  for (const line of items) {
    qtyByMenuId.set(line.menuItemId, (qtyByMenuId.get(line.menuItemId) ?? 0) + line.quantity);
  }

  const supabase = await createClient();
  const { data: menuRows, error: menuError } = await supabase
    .from("menu_items")
    .select("id,name,price_cents,is_available")
    .in("id", uniqueIds);

  if (menuError) {
    return { error: dbErrorMessage(menuError) };
  }

  const menuById = new Map<string, MenuRowForOrder>();
  for (const row of (menuRows ?? []) as MenuRowForOrder[]) {
    menuById.set(row.id, row);
  }

  for (const menuItemId of uniqueIds) {
    const row = menuById.get(menuItemId);
    if (!row) {
      return { error: "One or more items are no longer on the menu." };
    }
    if (!row.is_available) {
      return { error: `"${row.name}" is not available right now.` };
    }
  }

  for (const [menuItemId, quantity] of qtyByMenuId) {
    if (quantity > MAX_QUANTITY_PER_MENU_ITEM) {
      const name = menuById.get(menuItemId)?.name ?? "This item";
      return { error: `You can order at most ${MAX_QUANTITY_PER_MENU_ITEM} of "${name}" at a time.` };
    }
  }

  let subtotalCents = 0;
  const lineSnapshots: { menu_item_id: string; name: string; price_cents: number; quantity: number }[] =
    [];

  for (const [menuItemId, quantity] of qtyByMenuId) {
    const row = menuById.get(menuItemId)!;
    const lineTotal = row.price_cents * quantity;
    subtotalCents += lineTotal;
    lineSnapshots.push({
      menu_item_id: menuItemId,
      name: row.name,
      price_cents: row.price_cents,
      quantity,
    });
  }

  const totalCents = subtotalCents;
  const now = new Date().toISOString();
  const paymentStatus = paymentMethod === "razorpay" ? "pending" : "unpaid";
  const orderId = randomUUID();

  let razorpayCheckout: PlaceOrderRazorpayCheckout | undefined;
  let razorpayOrderId: string | null = null;

  if (paymentMethod === "razorpay") {
    let razorpayOrder: Awaited<ReturnType<typeof createRazorpayOrder>>;
    try {
      razorpayOrder = await createRazorpayOrder({
        amountCents: totalCents,
        receipt: orderId,
        notes: { campus_order_id: orderId },
      });
    } catch {
      return { error: "Could not start online payment. Try again or pay at the counter." };
    }
    razorpayOrderId = razorpayOrder.id;
    const creds = getRazorpayCredentials()!;
    razorpayCheckout = {
      keyId: creds.keyId,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    };
  }

  const { error: orderError } = await supabase.from("orders").insert({
    id: orderId,
    user_id: session.userId,
    status: "pending",
    payment_method: paymentMethod,
    payment_status: paymentStatus,
    subtotal_cents: subtotalCents,
    total_cents: totalCents,
    notes: notes ?? null,
    status_updated_at: now,
    razorpay_order_id: razorpayOrderId,
  });

  if (orderError) {
    return { error: dbErrorMessage(orderError) };
  }

  const orderItemsPayload = lineSnapshots.map((line) => ({
    order_id: orderId,
    menu_item_id: line.menu_item_id,
    name: line.name,
    price_cents: line.price_cents,
    quantity: line.quantity,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItemsPayload);

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", orderId);
    return { error: dbErrorMessage(itemsError) };
  }

  if (paymentMethod === "razorpay" && razorpayCheckout) {
    return { ok: true, orderId, razorpay: razorpayCheckout };
  }

  return { ok: true, orderId };
}

const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid("Invalid order"),
  status: z.enum(ORDER_STATUSES),
  estimatedReadyAt: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional(),
  statusMessage: z
    .string()
    .max(500, "Message must be 500 characters or fewer")
    .optional()
    .transform((s) => {
      const trimmed = s?.trim();
      return trimmed === "" ? undefined : trimmed;
    }),
});

function revalidateOrderPaths() {
  revalidatePath("/admin/orders");
  revalidatePath("/orders");
}

/**
 * Admin-only: advance order status with optional ETA and student-facing message.
 */
export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
  options?: { estimatedReadyAt?: string | null; statusMessage?: string }
): Promise<UpdateOrderStatusResult> {
  const session = await readCampusSession();
  if (!session.authed || !session.isAdmin) {
    return { error: "Admin access required." };
  }

  const parsed = updateOrderStatusSchema.safeParse({
    orderId,
    status,
    estimatedReadyAt: options?.estimatedReadyAt,
    statusMessage: options?.statusMessage,
  });

  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.orderId?.[0]
      ?? parsed.error.flatten().fieldErrors.status?.[0]
      ?? parsed.error.flatten().fieldErrors.estimatedReadyAt?.[0]
      ?? parsed.error.flatten().fieldErrors.statusMessage?.[0];
    return { error: msg ?? "Invalid update." };
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("orders")
    .select("status, payment_method, payment_status")
    .eq("id", parsed.data.orderId)
    .maybeSingle();

  if (fetchError) {
    return { error: dbErrorMessage(fetchError) };
  }
  if (!existing) {
    return { error: "Order not found." };
  }

  const fromStatus = existing.status as OrderStatus;
  if (!canTransitionOrderStatus(fromStatus, parsed.data.status)) {
    return { error: `Cannot move order from ${fromStatus} to ${parsed.data.status}.` };
  }

  if (
    parsed.data.status === "ready" &&
    existing.payment_method === "razorpay" &&
    existing.payment_status !== "paid"
  ) {
    return { error: "Mark the online payment as paid before marking the order ready." };
  }

  const now = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    status: parsed.data.status,
    status_updated_at: now,
  };

  if (options && "estimatedReadyAt" in options) {
    updatePayload.estimated_ready_at = parsed.data.estimatedReadyAt ?? null;
  }
  if (options && "statusMessage" in options) {
    updatePayload.status_message = parsed.data.statusMessage ?? null;
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", parsed.data.orderId);

  if (updateError) {
    return { error: dbErrorMessage(updateError) };
  }

  revalidateOrderPaths();
  return { ok: true };
}

/** Admin: full order with line items and payment fields. */
export async function fetchAdminOrderDetailAction(
  orderId: string
): Promise<{ order: Order | null; error?: string }> {
  const session = await readCampusSession();
  if (!session.isAdmin) {
    return { order: null, error: "Admin access required." };
  }

  const id = z.string().uuid().safeParse(orderId);
  if (!id.success) {
    return { order: null, error: "Invalid order" };
  }

  const order = await getOrderById(id.data);
  if (!order) {
    return { order: null, error: "Order not found or access denied." };
  }

  return { order };
}
