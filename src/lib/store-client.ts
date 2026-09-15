/** Client-safe pricing helpers (no Node fs) */

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

export function totalUnits(inventory: Record<string, number>): number {
  return Object.values(inventory).reduce((a, b) => a + b, 0);
}

export function clampSalePercent(value: number | undefined | null): number {
  if (!Number.isFinite(value as number)) return 0;
  return Math.max(0, Math.min(90, Math.round(value as number)));
}

/** Effective discount is the stronger of store-wide and product sale. */
export function getSalePercent(
  productSalePercent: number | undefined,
  storeSalePercent: number | undefined
): number {
  return Math.max(
    clampSalePercent(productSalePercent),
    clampSalePercent(storeSalePercent)
  );
}

export function getSalePrice(
  price: number,
  productSalePercent?: number,
  storeSalePercent?: number
): number {
  const pct = getSalePercent(productSalePercent, storeSalePercent);
  if (pct <= 0) return price;
  return Math.round(price * (100 - pct) * 100) / 100;
}

export function isOnSale(
  productSalePercent?: number,
  storeSalePercent?: number
): boolean {
  return getSalePercent(productSalePercent, storeSalePercent) > 0;
}
