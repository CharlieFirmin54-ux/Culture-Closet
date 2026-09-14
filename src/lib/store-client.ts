/** Client-safe helpers (no Node fs) */

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

export function totalUnits(inventory: Record<string, number>): number {
  return Object.values(inventory).reduce((a, b) => a + b, 0);
}
