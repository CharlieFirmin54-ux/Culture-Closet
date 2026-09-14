"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/store-client";
import type { Product } from "@/lib/types";

export function ProductBuyBox({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [size, setSize] = useState(product.sizes[0] || "");
  const [qty, setQty] = useState(1);
  const available = product.inventory[size] ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">
          {product.name}
        </h1>
        <p className="text-xl">{formatPrice(product.price)}</p>
      </div>

      <p className="text-[var(--muted)] leading-relaxed">{product.description}</p>

      <div>
        <p className="text-xs uppercase tracking-[0.12em] font-semibold mb-3">
          Size
        </p>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((s) => {
            const stock = product.inventory[s] ?? 0;
            return (
              <button
                key={s}
                type="button"
                className="size-btn disabled:opacity-30"
                data-active={size === s}
                disabled={stock <= 0}
                onClick={() => setSize(s)}
              >
                {s}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-[var(--muted)] mt-2">
          {available > 0 ? `${available} in stock` : "Out of stock"}
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.12em] font-semibold mb-3">
          Quantity
        </p>
        <div className="inline-flex items-center border border-ink">
          <button
            type="button"
            className="w-11 h-11"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="w-12 text-center">{qty}</span>
          <button
            type="button"
            className="w-11 h-11"
            onClick={() => setQty((q) => Math.min(available || 1, q + 1))}
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        disabled={available <= 0}
        onClick={() =>
          addItem({ productId: product.id, size, quantity: qty })
        }
      >
        Add to cart
      </button>

      <p className="text-sm text-[var(--muted)]">
        Pay online with Apple Pay or Google Pay — or pay with Apple Pay in
        person at pickup/delivery.
      </p>
    </div>
  );
}
