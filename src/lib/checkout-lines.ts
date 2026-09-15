import type { OrderItem } from "./types";

/** Stripe metadata values are capped at 500 characters. */
const META_VALUE_MAX = 450;

type CompactLine = {
  productId: string;
  size: string;
  quantity: number;
  unitPrice: number;
};

/** Encode order lines into chunked Stripe metadata keys (lines_0, lines_1, …). */
export function encodeLinesMetadata(
  lines: OrderItem[]
): Record<string, string> {
  const compact: CompactLine[] = lines.map((l) => ({
    productId: l.productId,
    size: l.size,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
  }));
  const json = JSON.stringify(compact);
  const meta: Record<string, string> = {
    itemCount: String(lines.length),
  };

  if (json.length <= META_VALUE_MAX) {
    meta.lines_0 = json;
    return meta;
  }

  // Chunk by whole compact objects so JSON stays valid per key.
  const chunks: CompactLine[][] = [];
  let current: CompactLine[] = [];
  for (const line of compact) {
    const trial = [...current, line];
    if (JSON.stringify(trial).length > META_VALUE_MAX && current.length) {
      chunks.push(current);
      current = [line];
    } else {
      current = trial;
    }
  }
  if (current.length) chunks.push(current);

  chunks.forEach((chunk, i) => {
    meta[`lines_${i}`] = JSON.stringify(chunk);
  });
  return meta;
}

/** Decode chunked Stripe metadata back into compact cart lines. */
export function decodeLinesMetadata(
  metadata: Record<string, string>
): CompactLine[] {
  // Legacy single-key format from earlier deploys
  if (metadata.lines) {
    try {
      const parsed = JSON.parse(metadata.lines) as OrderItem[] | CompactLine[];
      return parsed.map((l) => ({
        productId: l.productId,
        size: l.size,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
      }));
    } catch {
      return [];
    }
  }

  const keys = Object.keys(metadata)
    .filter((k) => /^lines_\d+$/.test(k))
    .sort((a, b) => Number(a.split("_")[1]) - Number(b.split("_")[1]));

  const out: CompactLine[] = [];
  for (const key of keys) {
    try {
      const chunk = JSON.parse(metadata[key] || "[]") as CompactLine[];
      if (Array.isArray(chunk)) out.push(...chunk);
    } catch {
      // skip bad chunk
    }
  }
  return out;
}
