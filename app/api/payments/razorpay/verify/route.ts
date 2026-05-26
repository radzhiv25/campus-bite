import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getRazorpayCredentials,
  verifyRazorpayPaymentSignature,
} from "@/lib/payments/razorpay";
import { createClient } from "@/lib/supabase/server";
import { readCampusSession } from "@/lib/session";

const verifyBodySchema = z.object({
  orderId: z.string().uuid("Invalid order"),
  razorpayOrderId: z.string().min(1, "Missing Razorpay order id"),
  razorpayPaymentId: z.string().min(1, "Missing Razorpay payment id"),
  razorpaySignature: z.string().min(1, "Missing payment signature"),
});

function dbErrorMessage(error: { code?: string; message: string }): string {
  if (error.code === "42501" || /permission denied|row-level security/i.test(error.message)) {
    return "Could not confirm payment. Ensure orders payment policies are applied in Supabase.";
  }
  return error.message;
}

export async function POST(request: Request) {
  const session = await readCampusSession();
  if (!session.authed || !session.userId) {
    return NextResponse.json({ error: "Sign in to confirm payment." }, { status: 401 });
  }

  const creds = getRazorpayCredentials();
  if (!creds) {
    return NextResponse.json({ error: "Online payment is not configured." }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = verifyBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment confirmation." }, { status: 400 });
  }

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

  const signatureValid = verifyRazorpayPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    creds.keySecret
  );

  if (!signatureValid) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, user_id, payment_method, payment_status, razorpay_order_id")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: dbErrorMessage(fetchError) }, { status: 500 });
  }
  if (!order || order.user_id !== session.userId) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.payment_method !== "razorpay") {
    return NextResponse.json({ error: "This order does not use online payment." }, { status: 400 });
  }
  if (order.razorpay_order_id !== razorpayOrderId) {
    return NextResponse.json({ error: "Payment does not match this order." }, { status: 400 });
  }
  if (order.payment_status === "paid") {
    return NextResponse.json({ ok: true, orderId });
  }
  if (order.payment_status !== "pending") {
    return NextResponse.json({ error: "This order cannot accept payment." }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      razorpay_payment_id: razorpayPaymentId,
    })
    .eq("id", orderId)
    .eq("user_id", session.userId);

  if (updateError) {
    return NextResponse.json({ error: dbErrorMessage(updateError) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, orderId });
}
