"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, CreditCard, Loader2, Store } from "lucide-react";

import { useCart } from "@/components/menu/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { orderDetailPath, ROUTES, SITE } from "@/constants/site";
import { rememberActiveOrderId } from "@/lib/orders/active-order";
import {
  MAX_QUANTITY_PER_MENU_ITEM,
  MAX_QUANTITY_PER_MENU_ITEM_MESSAGE,
} from "@/lib/orders/limits";
import { formatMenuPrice } from "@/lib/menu/format-price";
import { placeOrderAction } from "@/lib/orders/actions";
import type { PaymentMethod } from "@/lib/orders/status";
import type { PlaceOrderRazorpayCheckout } from "@/lib/orders/types";

type RazorpayCheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutInstance = {
  open: () => void;
  on: (event: string, handler: (response: { error: { description: string } }) => void) => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayCheckoutInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

function loadRazorpayCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay is only available in the browser."));
  }
  if (window.Razorpay) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay checkout.")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout."));
    document.body.appendChild(script);
  });
}

async function verifyRazorpayPayment(payload: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<{ ok: true; orderId: string } | { error: string }> {
  const res = await fetch("/api/payments/razorpay/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { ok?: boolean; orderId?: string; error?: string };
  if (!res.ok || !data.ok || !data.orderId) {
    return { error: data.error ?? "Payment could not be confirmed. Contact the canteen if you were charged." };
  }
  return { ok: true, orderId: data.orderId };
}

export function CheckoutForm() {
  const router = useRouter();
  const { lines, subtotalCents, totalQuantity, clearCart } = useCart();
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("counter");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  if (lines.length === 0) {
    return (
      <Card className="mx-auto max-w-lg border-dashed">
        <CardHeader className="text-center">
          <CardTitle>Nothing to check out</CardTitle>
          <CardDescription>Add items from the menu before placing an order.</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center gap-2 pb-6">
          <Button variant="outline" asChild>
            <Link href={ROUTES.cart}>View cart</Link>
          </Button>
          <Button asChild>
            <Link href={ROUTES.menu}>Browse menu</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const unavailable = lines.filter(({ item }) => !item.is_available);

  async function openRazorpayCheckout(
    orderId: string,
    razorpay: PlaceOrderRazorpayCheckout,
    onVerified: () => void
  ) {
    await loadRazorpayCheckoutScript();
    if (!window.Razorpay) {
      setError("Could not open online payment. Try again or pay at the counter.");
      return;
    }

    const rzp = new window.Razorpay({
      key: razorpay.keyId,
      amount: razorpay.amount,
      currency: razorpay.currency,
      name: SITE.name,
      description: "Campus canteen order",
      order_id: razorpay.razorpayOrderId,
      handler: async (response: RazorpayCheckoutResponse) => {
        const verified = await verifyRazorpayPayment({
          orderId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        if ("error" in verified) {
          setError(verified.error);
          return;
        }
        rememberActiveOrderId(verified.orderId);
        onVerified();
        router.push(orderDetailPath(verified.orderId));
        router.refresh();
      },
      modal: {
        ondismiss: () => {
          setError("Payment cancelled. Your order is saved — pay online from order details or at the counter.");
        },
      },
      theme: { color: "#b45309" },
    });

    rzp.on("payment.failed", (response) => {
      setError(response.error.description || "Payment failed. Try again.");
    });
    rzp.open();
  }

  function handlePlaceOrder() {
    setError(null);
    setFieldErrors({});

    if (unavailable.length > 0) {
      setError("Remove unavailable items before placing your order.");
      return;
    }

    const overLimit = lines.find(({ quantity }) => quantity > MAX_QUANTITY_PER_MENU_ITEM);
    if (overLimit) {
      setError(
        `${MAX_QUANTITY_PER_MENU_ITEM_MESSAGE} Reduce "${overLimit.item.name}" in your cart.`
      );
      return;
    }

    startTransition(async () => {
      const result = await placeOrderAction({
        items: lines.map(({ item, quantity }) => ({
          menuItemId: item.id,
          quantity,
        })),
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      if ("ok" in result && result.ok && result.orderId) {
        rememberActiveOrderId(result.orderId);
        if (paymentMethod === "counter") {
          clearCart();
          router.push(orderDetailPath(result.orderId));
          router.refresh();
          return;
        }

        if (result.razorpay) {
          const orderId = result.orderId;
          try {
            await openRazorpayCheckout(orderId, result.razorpay, () => clearCart());
          } catch {
            setError("Could not open online payment. Your order was created — try again from order details.");
          }
          return;
        }

        setError("Online payment could not be started. Try pay at counter.");
        return;
      }

      if ("fieldErrors" in result && result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      }
      setError(("error" in result && result.error) || "Could not place order. Try again.");
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
          <CardDescription>
            {totalQuantity} {totalQuantity === 1 ? "item" : "items"} ·{" "}
            {paymentMethod === "counter"
              ? "Pay at the counter when you pick up"
              : "Pay online now with Razorpay (test mode supported)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
            {lines.map(({ item, quantity, lineSubtotalCents }) => (
              <li key={item.id} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {item.name}
                    {!item.is_available ? (
                      <span className="ml-2 text-xs font-normal text-destructive">(unavailable)</span>
                    ) : null}
                  </p>
                  <p className="text-muted-foreground">
                    {quantity} × {formatMenuPrice(item.price_cents)}
                  </p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">{formatMenuPrice(lineSubtotalCents)}</p>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span className="tabular-nums">{formatMenuPrice(subtotalCents)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment</CardTitle>
          <CardDescription>Choose how you want to pay for this order.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <fieldset className="space-y-3">
            <legend className="sr-only">Payment method</legend>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              className="grid gap-3 sm:grid-cols-2"
              disabled={isPending}
            >
              <div className="flex items-start gap-3 rounded-lg border border-border p-4 has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-primary/5">
                <RadioGroupItem value="counter" id="pay-counter" className="mt-0.5" />
                <div className="space-y-1">
                  <Label htmlFor="pay-counter" className="flex cursor-pointer items-center gap-2 font-medium">
                    <Store className="size-4 text-amber-700 dark:text-amber-300" aria-hidden />
                    Pay at counter
                  </Label>
                  <p className="text-xs text-muted-foreground">Pay when you collect your order at the canteen.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border p-4 has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-primary/5">
                <RadioGroupItem value="razorpay" id="pay-razorpay" className="mt-0.5" />
                <div className="space-y-1">
                  <Label htmlFor="pay-razorpay" className="flex cursor-pointer items-center gap-2 font-medium">
                    <CreditCard className="size-4 text-primary" aria-hidden />
                    Pay online
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    UPI, card, or netbanking via Razorpay. Use test keys in development.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="order-notes">Notes for the canteen (optional)</Label>
            <Textarea
              id="order-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Allergies, pickup instructions, etc."
              maxLength={500}
              rows={3}
              disabled={isPending}
              aria-invalid={Boolean(fieldErrors.notes)}
            />
            {fieldErrors.notes ? (
              <p className="text-sm text-destructive" role="alert">
                {fieldErrors.notes}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">{notes.length}/500</p>
          </div>
          {fieldErrors.items ? (
            <p className="text-sm text-destructive" role="alert">
              {fieldErrors.items}
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button variant="outline" asChild disabled={isPending}>
            <Link href={ROUTES.cart} className="gap-2">
              <ArrowLeft className="size-4" aria-hidden />
              Back to cart
            </Link>
          </Button>
          <Button type="button" onClick={handlePlaceOrder} disabled={isPending || unavailable.length > 0}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {paymentMethod === "razorpay" ? "Starting payment…" : "Placing order…"}
              </>
            ) : paymentMethod === "razorpay" ? (
              "Pay online"
            ) : (
              "Place order"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
