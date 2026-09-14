import { NextResponse } from "next/server";
import { getProductById, listProducts } from "@/lib/store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ids = searchParams.get("ids")?.split(",").filter(Boolean);
  if (ids?.length) {
    const products = [];
    for (const id of ids) {
      const p = await getProductById(id);
      if (p) {
        products.push({
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image,
          slug: p.slug,
        });
      }
    }
    return NextResponse.json({ products });
  }
  const category = searchParams.get("category") || undefined;
  const includeInactive = searchParams.get("all") === "1";
  const products = await listProducts({ category, includeInactive });
  return NextResponse.json({ products });
}
