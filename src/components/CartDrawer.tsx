"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/store-client";

type ProductLite = {
  id: string;
  name: string;
  price: number;
  image: string;
  slug: string;
};

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, count } = useCart();
  const [products, setProducts] = useState<Record<string, ProductLite>>({});

  useEffect(() => {
    if (!isOpen || items.length === 0) return;
    const ids = [...new Set(items.map((i) => i.productId))].join(",");
    fetch(`/api/products?ids=${ids}`)
      .then((r) => r.json())
      .then((data: { products: ProductLite[] }) => {
        const map: Record<string, ProductLite> = {};
        for (const p of data.products) map[p.id] = p;
        setProducts(map);
      })
      .catch(() => undefined);
  }, [isOpen, items]);

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const p = products[item.productId];
      return sum + (p?.price ?? 0) * item.quantity;
    }, 0);
  }, [items, products]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 cart-overlay"
        aria-label="Close cart"
        onClick={closeCart}
      />
      <aside className="cart-panel absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)]">
          <h2 className="font-semibold tracking-wide">
            Cart {count > 0 ? `(${count})` : ""}
          </h2>
          <button type="button" aria-label="Close" onClick={closeCart}>
            <X size={22} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
            <p className="text-lg">Your cart is empty</p>
            <p className="text-sm text-[var(--muted)]">
              Have an account?{" "}
              <Link href="/login" className="underline" onClick={closeCart}>
                Log in
              </Link>{" "}
              to check out faster
            </p>
            <button type="button" className="btn-dark px-8" onClick={closeCart}>
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {items.map((item) => {
                const p = products[item.productId];
                return (
                  <div
                    key={`${item.productId}-${item.size}`}
                    className="flex gap-4"
                  >
                    <div className="relative w-20 h-24 bg-[var(--soft)] shrink-0 overflow-hidden">
                      {p?.image && (
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {p?.name || "Loading…"}
                      </p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        Size {item.size}
                      </p>
                      <p className="text-sm mt-1">
                        {p ? formatPrice(p.price) : "—"}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border border-[var(--line)]">
                          <button
                            type="button"
                            className="w-8 h-8"
                            onClick={() =>
                              updateQty(
                                item.productId,
                                item.size,
                                item.quantity - 1
                              )
                            }
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="w-8 h-8"
                            onClick={() =>
                              updateQty(
                                item.productId,
                                item.size,
                                item.quantity + 1
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className="text-xs underline text-[var(--muted)]"
                          onClick={() =>
                            removeItem(item.productId, item.size)
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-[var(--line)] p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-semibold">{formatPrice(total)}</span>
              </div>
              <Link
                href="/checkout"
                className="btn-primary block text-center"
                onClick={closeCart}
              >
                Checkout
              </Link>
              <p className="text-[11px] text-center text-[var(--muted)]">
                Apple Pay & Google Pay available at checkout
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
