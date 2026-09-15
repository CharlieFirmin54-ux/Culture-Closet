import {
  getSalePercent,
  getSalePrice,
  isOnSale,
} from "@/lib/store-client";
import type { Product } from "@/lib/types";

export type PricedProduct = Product & {
  storeSalePercent: number;
  effectiveSalePercent: number;
  salePrice: number;
  onSale: boolean;
};

export function withPricing(
  product: Product,
  storeSalePercent: number
): PricedProduct {
  const effectiveSalePercent = getSalePercent(
    product.salePercent,
    storeSalePercent
  );
  return {
    ...product,
    storeSalePercent,
    effectiveSalePercent,
    salePrice: getSalePrice(
      product.price,
      product.salePercent,
      storeSalePercent
    ),
    onSale: isOnSale(product.salePercent, storeSalePercent),
  };
}
