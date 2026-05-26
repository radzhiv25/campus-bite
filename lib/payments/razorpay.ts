import crypto from "crypto";

import Razorpay from "razorpay";

import { SITE } from "@/constants/site";

export type RazorpayCredentials = {
  keyId: string;
  keySecret: string;
};

export function getRazorpayCredentials(): RazorpayCredentials | null {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    return null;
  }
  return { keyId, keySecret };
}

export function requireRazorpayCredentials(): RazorpayCredentials {
  const creds = getRazorpayCredentials();
  if (!creds) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment."
    );
  }
  return creds;
}

function createRazorpayClient(creds: RazorpayCredentials): Razorpay {
  return new Razorpay({
    key_id: creds.keyId,
    key_secret: creds.keySecret,
  });
}

export type CreateRazorpayOrderParams = {
  amountCents: number;
  receipt: string;
  notes?: Record<string, string>;
};

export type CreateRazorpayOrderResult = {
  id: string;
  amount: number;
  currency: string;
};

/**
 * Create a Razorpay order (amount in paise for INR).
 */
export async function createRazorpayOrder(
  params: CreateRazorpayOrderParams
): Promise<CreateRazorpayOrderResult> {
  const creds = requireRazorpayCredentials();
  const client = createRazorpayClient(creds);

  const order = await client.orders.create({
    amount: params.amountCents,
    currency: SITE.menu.currency,
    receipt: params.receipt.slice(0, 40),
    notes: params.notes,
  });

  return {
    id: order.id,
    amount: Number(order.amount),
    currency: order.currency,
  };
}

/**
 * Verify Razorpay Checkout signature (order_id|payment_id).
 */
export function verifyRazorpayPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
  keySecret?: string
): boolean {
  const secret = keySecret ?? requireRazorpayCredentials().keySecret;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  return expected === signature;
}
