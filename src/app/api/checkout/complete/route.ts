import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { decodeLinesMetadata } from "@/lib/checkout-lines";
import { createOrder, decrementStock, getProductById } from "@/lib/store";
import { getStripe } from "@/lib/stripe";
import type { Order, OrderItem, PaymentMethod } from "@/lib/types";

const schema = z.object({
  paymentIntentId: z.string(),
  paymentMethod: z.enum([
    "card",
    "apple_pay",
    "google_pay",
    "apple_pay_in_person",
  ]),
  channel: z.enum(["online", "in_person"]),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.parse(await req.json());
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 400 }
      );
    }
    const intent = await stripe.paymentIntents.retrieve(parsed.paymentIntentId);
    if (intent.status !== "succeeded" && intent.status !== "processing") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    const compact = decodeLinesMetadata(
      intent.metadata as Record<string, string>
    );
    if (!compact.length) {
      return NextResponse.json(
        { error: "Payment is missing cart items" },
        { status: 400 }
      );
    }

    const lines: OrderItem[] = [];
    for (const row of compact) {
      const product = await getProductById(row.productId);
      lines.push({
        productId: row.productId,
        name: product?.name || row.productId,
        size: row.size,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
      });
    }

    const stock = await decrementStock(
      lines.map((l) => ({
        productId: l.productId,
        size: l.size,
        quantity: l.quantity,
      }))
    );
    if (!stock.ok) {
      return NextResponse.json({ error: stock.error }, { status: 400 });
    }

    const session = await getSession();
    const paymentMethod: PaymentMethod = parsed.paymentMethod;

    const order: Order = {
      id: `ord_${crypto.randomUUID().slice(0, 10)}`,
      userId: session?.id || intent.metadata.userId || undefined,
      email: intent.metadata.email || intent.receipt_email || "",
      items: lines,
      total: (intent.amount_received || intent.amount) / 100,
      currency: "gbp",
      channel: parsed.channel,
      paymentMethod,
      status: "paid",
      createdAt: new Date().toISOString(),
      stripePaymentIntentId: intent.id,
    };
    await createOrder(order);
    return NextResponse.json({ orderId: order.id, itemCount: lines.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Complete failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
