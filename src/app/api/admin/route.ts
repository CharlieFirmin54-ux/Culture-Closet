import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  listOrders,
  listProducts,
  removeProduct,
  setProductActive,
  totalUnits,
  updateInventory,
} from "@/lib/store";

export async function GET() {
  try {
    await requireAdmin();
    const products = await listProducts({ includeInactive: true });
    const orders = await listOrders();
    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        units: totalUnits(p),
      })),
      orders,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const action = body.action as string;

    if (action === "inventory") {
      const parsed = z
        .object({
          productId: z.string(),
          inventory: z.record(z.string(), z.number().int().min(0)),
        })
        .parse(body);
      const product = await updateInventory(
        parsed.productId,
        parsed.inventory
      );
      return NextResponse.json({ product });
    }

    if (action === "active") {
      const parsed = z
        .object({ productId: z.string(), active: z.boolean() })
        .parse(body);
      const product = await setProductActive(parsed.productId, parsed.active);
      return NextResponse.json({ product });
    }

    if (action === "remove") {
      const parsed = z.object({ productId: z.string() }).parse(body);
      const ok = await removeProduct(parsed.productId);
      return NextResponse.json({ ok });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Admin error";
    const status = message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
