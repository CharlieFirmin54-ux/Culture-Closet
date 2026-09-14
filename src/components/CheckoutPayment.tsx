"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import type { CartItem, PaymentMethod } from "@/lib/types";
import { formatPrice } from "@/lib/store-client";

type Props = {
  items: CartItem[];
  email: string;
  channel?: "online" | "in_person";
  onSuccess: (orderId: string) => void;
};

function InnerCheckout({
  email,
  channel = "online",
  onSuccess,
  totalLabel,
}: {
  email: string;
  channel: "online" | "in_person";
  onSuccess: (orderId: string) => void;
  totalLabel: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expressReady, setExpressReady] = useState(false);

  async function confirm(paymentMethod: PaymentMethod) {
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "Payment form error");
      setBusy(false);
      return;
    }
    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
        payment_method_data: {
          billing_details: { email },
        },
      },
    });
    if (result.error) {
      setError(result.error.message || "Payment failed");
      setBusy(false);
      return;
    }
    const intent = result.paymentIntent;
    if (intent?.status === "succeeded" || intent?.status === "processing") {
      const res = await fetch("/api/checkout/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId: intent.id,
          paymentMethod,
          channel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not finalize order");
        setBusy(false);
        return;
      }
      onSuccess(data.orderId);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      <div className={expressReady ? "block" : "hidden"}>
        <p className="text-xs uppercase tracking-[0.12em] font-semibold mb-3">
          {channel === "in_person"
            ? "Apple Pay in person"
            : "Express checkout"}
        </p>
        <ExpressCheckoutElement
          options={{
            buttonType: {
              applePay: channel === "in_person" ? "plain" : "buy",
              googlePay: "buy",
            },
            paymentMethods: {
              applePay: "always",
              googlePay: channel === "in_person" ? "never" : "always",
              link: "never",
              paypal: "never",
              amazonPay: "never",
              klarna: "never",
            },
            layout: { maxColumns: 1, maxRows: 2 },
          }}
          onReady={({ availablePaymentMethods }) => {
            setExpressReady(
              Boolean(
                availablePaymentMethods?.applePay ||
                  availablePaymentMethods?.googlePay
              )
            );
          }}
          onConfirm={async () => {
            await confirm(
              channel === "in_person"
                ? "apple_pay_in_person"
                : "apple_pay"
            );
          }}
        />
        {channel === "online" && (
          <div className="flex items-center gap-3 my-4 text-xs text-[var(--muted)]">
            <span className="flex-1 h-px bg-[var(--line)]" />
            Or pay with card
            <span className="flex-1 h-px bg-[var(--line)]" />
          </div>
        )}
      </div>

      {channel === "online" && (
        <>
          <PaymentElement />
          <button
            type="button"
            className="btn-primary"
            disabled={busy || !stripe}
            onClick={() => confirm("card")}
          >
            {busy ? "Processing…" : `Pay ${totalLabel}`}
          </button>
        </>
      )}

      {channel === "in_person" && !expressReady && (
        <p className="text-sm text-[var(--muted)] border border-[var(--line)] p-4">
          Apple Pay is not available on this device/browser. Open this POS page
          on an iPhone or Safari with Apple Pay set up, or use a Stripe Terminal
          reader for Tap to Pay.
        </p>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}

function DemoCheckout({
  items,
  email,
  channel,
  onSuccess,
  total,
}: {
  items: CartItem[];
  email: string;
  channel: "online" | "in_person";
  onSuccess: (orderId: string) => void;
  total: number;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>(
    channel === "in_person" ? "apple_pay_in_person" : "apple_pay"
  );

  async function pay() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/checkout/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, email, channel, paymentMethod: method }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Demo payment failed");
      return;
    }
    onSuccess(data.orderId);
  }

  return (
    <div className="space-y-4 border border-dashed border-[var(--line)] p-4">
      <p className="text-sm font-medium">Demo payments (no Stripe keys)</p>
      <p className="text-xs text-[var(--muted)] leading-relaxed">
        Add <code>STRIPE_SECRET_KEY</code> and{" "}
        <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to enable live Apple Pay
        & Google Pay. Until then, simulate wallets below.
      </p>
      <div className="flex flex-col gap-2">
        {(channel === "in_person"
          ? (["apple_pay_in_person"] as PaymentMethod[])
          : (["apple_pay", "google_pay", "card"] as PaymentMethod[])
        ).map((m) => (
          <label key={m} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="method"
              checked={method === m}
              onChange={() => setMethod(m)}
            />
            {m === "apple_pay"
              ? "Apple Pay"
              : m === "google_pay"
                ? "Google Pay"
                : m === "apple_pay_in_person"
                  ? "Apple Pay (in person / pickup)"
                  : "Card"}
          </label>
        ))}
      </div>
      <button
        type="button"
        className="btn-primary"
        disabled={busy || !email}
        onClick={pay}
      >
        {busy ? "Processing…" : `Pay ${formatPrice(total)}`}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}

export function CheckoutPayment({
  items,
  email,
  channel = "online",
  onSuccess,
}: Props) {
  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [mode, setMode] = useState<"stripe" | "demo" | "loading">("loading");
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const itemKey = useMemo(() => JSON.stringify(items), [items]);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      setMode("loading");
      setError(null);
      const res = await fetch("/api/checkout/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, email, channel }),
      });
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setError(data.error || "Could not start checkout");
        setMode("demo");
        return;
      }
      setTotal(data.total);
      if (data.mode === "demo") {
        setMode("demo");
        return;
      }
      setClientSecret(data.clientSecret);
      setStripePromise(loadStripe(data.publishableKey));
      setMode("stripe");
    }
    if (items.length && email) boot();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemKey, email, channel]);

  if (!items.length) {
    return <p className="text-sm text-[var(--muted)]">Your cart is empty.</p>;
  }

  if (!email) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Enter your email to continue.
      </p>
    );
  }

  if (error && mode === "loading") {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (mode === "loading") {
    return <p className="text-sm text-[var(--muted)]">Preparing payment…</p>;
  }

  if (mode === "demo") {
    return (
      <DemoCheckout
        items={items}
        email={email}
        channel={channel}
        onSuccess={onSuccess}
        total={total}
      />
    );
  }

  if (!clientSecret || !stripePromise) return null;

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: "stripe", variables: { borderRadius: "0px" } },
      }}
    >
      <InnerCheckout
        email={email}
        channel={channel}
        onSuccess={onSuccess}
        totalLabel={formatPrice(total)}
      />
    </Elements>
  );
}
