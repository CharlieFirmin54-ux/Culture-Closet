import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  createOrder,
  decrementStock,
  getProductById,
  getStoreSettings,
} from "@/lib/store";
import { getSalePrice } from "@/lib/store-client";
import type { Order, OrderItem } from "@/lib/types";

const schema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        size: z.string(),
        quantity: z.number().int().positive().max(99),
      })
    )
    .min(1)
    .max(50),
  email: z.string().email(),
  channel: z.enum(["online", "in_person"]),
  paymentMethod: z.enum([
    "card",
    "apple_pay",
    "google_pay",
    "apple_pay_in_person",
  ]),
});

export async function POST(req: Request) {
  try {
    if (process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Demo checkout disabled when Stripe is configured" },
        { status: 400 }
      );
    }
    const parsed = schema.parse(await req.json());
    const settings = await getStoreSettings();
    const lines: OrderItem[] = [];
    let total = 0;
    for (const item of parsed.items) {
      const product = await getProductById(item.productId);
      if (!product || !product.active) {
        return NextResponse.json(
          { error: "Product unavailable" },
          { status: 400 }
        );
      }
      const unitPrice = getSalePrice(
        product.price,
        product.salePercent,
        settings.storeSalePercent
      );
      lines.push({
        productId: product.id,
        name: product.name,
        size: item.size,
        quantity: item.quantity,
        unitPrice,
      });
      total += unitPrice * item.quantity;
    }

    const stock = await decrementStock(parsed.items);
    if (!stock.ok) {
      return NextResponse.json({ error: stock.error }, { status: 400 });
    }

    const session = await getSession();
    const order: Order = {
      id: `ord_${crypto.randomUUID().slice(0, 10)}`,
      userId: session?.id,
      email: parsed.email,
      items: lines,
      total,
      currency: "gbp",
      channel: parsed.channel,
      paymentMethod: parsed.paymentMethod,
      status: "paid",
      createdAt: new Date().toISOString(),
    };
    await createOrder(order);
    return NextResponse.json({ orderId: order.id, mode: "demo" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Demo pay failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
