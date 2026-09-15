"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/store-client";
import type { PricedProduct } from "@/lib/pricing";

export function ProductBuyBox({ product }: { product: PricedProduct }) {
  const { addItem, openCart } = useCart();
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const available = size ? (product.inventory[size] ?? 0) : 0;

  function handleAdd() {
    if (!size) {
      setError("Select a size");
      return;
    }
    if (available <= 0) {
      setError("That size is out of stock");
      return;
    }
    setError("");
    addItem({ productId: product.id, size, quantity: qty });
    openCart();
  }

  return (
    <div className="buy-box">
      <div>
        <p className="buy-box-cat">{product.category}</p>
        <h1 className="buy-box-title">{product.name}</h1>
        <p className={`buy-box-price${product.onSale ? " has-sale" : ""}`}>
          {product.onSale ? (
            <>
              <span className="price-was">{formatPrice(product.price)}</span>{" "}
              <span className="price-now">{formatPrice(product.salePrice)}</span>
              <span className="price-off"> −{product.effectiveSalePercent}%</span>
            </>
          ) : (
            formatPrice(product.price)
          )}
        </p>
      </div>

      <p className="buy-box-desc">{product.description}</p>

      <div>
        <div className="buy-box-row">
          <p className="buy-box-label">Size</p>
          {size ? (
            <p className="buy-box-hint">{available} in stock</p>
          ) : (
            <p className="buy-box-hint">Select a size</p>
          )}
        </div>
        <div className="size-grid" role="listbox" aria-label="Size">
          {product.sizes.map((s) => {
            const stock = product.inventory[s] ?? 0;
            const selected = size === s;
            return (
              <button
                key={s}
                type="button"
                role="option"
                aria-selected={selected}
                className={`size-btn${selected ? " is-active" : ""}`}
                disabled={stock <= 0}
                onClick={() => {
                  setSize(s);
                  setError("");
                  setQty(1);
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
        {error ? <p className="buy-box-error">{error}</p> : null}
      </div>

      <div>
        <p className="buy-box-label">Quantity</p>
        <div className="qty-control">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span>{qty}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() =>
              setQty((q) => Math.min(Math.max(available, 1), q + 1))
            }
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        disabled={Boolean(size) && available <= 0}
        onClick={handleAdd}
      >
        {size ? "Add to cart" : "Select a size"}
      </button>

      <p className="buy-box-note">
        Pay online with Apple Pay or Google Pay — or pay with Apple Pay in
        person at pickup/delivery.
      </p>
    </div>
  );
}
