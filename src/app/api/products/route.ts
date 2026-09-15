import { NextResponse } from "next/server";
import { getProductById, getStoreSettings, listProducts } from "@/lib/store";
import { getSalePercent, getSalePrice } from "@/lib/store-client";

function withPricing<T extends { price: number; salePercent?: number }>(
  product: T,
  storeSalePercent: number
) {
  const salePercent = getSalePercent(product.salePercent, storeSalePercent);
  const salePrice = getSalePrice(
    product.price,
    product.salePercent,
    storeSalePercent
  );
  return {
    ...product,
    salePercent: product.salePercent || 0,
    storeSalePercent,
    effectiveSalePercent: salePercent,
    salePrice,
    onSale: salePercent > 0,
  };
}

export async function GET(req: Request) {
  const settings = await getStoreSettings();
  const storeSalePercent = settings.storeSalePercent;
  const { searchParams } = new URL(req.url);
  const ids = searchParams.get("ids")?.split(",").filter(Boolean);
  if (ids?.length) {
    const products = [];
    for (const id of ids) {
      const p = await getProductById(id);
      if (p) {
        products.push(
          withPricing(
            {
              id: p.id,
              name: p.name,
              price: p.price,
              salePercent: p.salePercent,
              image: p.image,
              slug: p.slug,
            },
            storeSalePercent
          )
        );
      }
    }
    return NextResponse.json({ products, settings });
  }
  const category = searchParams.get("category") || undefined;
  const includeInactive = searchParams.get("all") === "1";
  const products = await listProducts({ category, includeInactive });
  return NextResponse.json({
    products: products.map((p) => withPricing(p, storeSalePercent)),
    settings,
  });
}
