import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getProductById, getStoreSettings } from "@/lib/store";
import { getSalePrice } from "@/lib/store-client";
import { getPublishableKey, getStripe, hasStripe, toMinor } from "@/lib/stripe";
import type { CartItem } from "@/lib/types";

const bodySchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      size: z.string(),
      quantity: z.number().int().positive(),
    })
  ),
  email: z.string().email(),
  channel: z.enum(["online", "in_person"]).default("online"),
});

async function priceCart(items: CartItem[]) {
  const settings = await getStoreSettings();
  let total = 0;
  const lines: {
    productId: string;
    name: string;
    size: string;
    quantity: number;
    unitPrice: number;
  }[] = [];
  for (const item of items) {
    const product = await getProductById(item.productId);
    if (!product || !product.active) {
      throw new Error("A product in your cart is no longer available");
    }
    const stock = product.inventory[item.size] ?? 0;
    if (stock < item.quantity) {
      throw new Error(`Not enough stock for ${product.name} (${item.size})`);
    }
    const unitPrice = getSalePrice(
      product.price,
      product.salePercent,
      settings.storeSalePercent
    );
    total += unitPrice * item.quantity;
    lines.push({
      productId: product.id,
      name: product.name,
      size: item.size,
      quantity: item.quantity,
      unitPrice,
    });
  }
  return { total, lines };
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.parse(json);
    const { total, lines } = await priceCart(parsed.items);
    const session = await getSession();

    if (!hasStripe()) {
      return NextResponse.json({
        mode: "demo",
        total,
        lines,
      });
    }

    const stripe = getStripe()!;
    const intent = await stripe.paymentIntents.create({
      amount: toMinor(total),
      currency: "gbp",
      automatic_payment_methods: { enabled: true },
      receipt_email: parsed.email,
      metadata: {
        channel: parsed.channel,
        userId: session?.id || "",
        email: parsed.email,
        lines: JSON.stringify(lines),
      },
    });

    return NextResponse.json({
      mode: "stripe",
      clientSecret: intent.client_secret,
      publishableKey: getPublishableKey(),
      total,
      paymentIntentId: intent.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
