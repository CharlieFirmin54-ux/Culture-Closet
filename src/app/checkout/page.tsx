"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { CheckoutPayment } from "@/components/CheckoutPayment";
import { formatPrice } from "@/lib/store-client";

type ProductLite = {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  onSale?: boolean;
};

export default function CheckoutPage() {
  const { items, clear } = useCart();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [products, setProducts] = useState<Record<string, ProductLite>>({});

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.email) setEmail(d.user.email);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!items.length) return;
    const ids = [...new Set(items.map((i) => i.productId))].join(",");
    fetch(`/api/products?ids=${ids}`)
      .then((r) => r.json())
      .then((data: { products: ProductLite[] }) => {
        const map: Record<string, ProductLite> = {};
        for (const p of data.products) map[p.id] = p;
        setProducts(map);
      })
      .catch(() => undefined);
  }, [items]);

  const total = useMemo(
    () =>
      items.reduce((sum, i) => {
        const p = products[i.productId];
        const unit =
          p?.onSale && p.salePrice != null ? p.salePrice : p?.price ?? 0;
        return sum + unit * i.quantity;
      }, 0),
    [items, products]
  );

  if (!items.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="page-title mb-4 text-[2.5rem]">Checkout</h1>
        <p className="text-[var(--muted)]">Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
      <h1 className="page-title mb-10">Checkout</h1>
      <div className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[var(--line)] px-3 py-3 outline-none focus:border-ink"
              placeholder="you@email.com"
            />
          </label>

          <CheckoutPayment
            items={items}
            email={email}
            channel="online"
            onSuccess={(orderId) => {
              clear();
              router.push(`/checkout/success?order=${orderId}`);
            }}
          />
        </div>

        <div className="border border-[var(--line)] p-5 h-fit">
          <h2 className="font-semibold mb-4">Order summary</h2>
          <ul className="space-y-3 text-sm mb-5">
            {items.map((item) => (
              <li
                key={`${item.productId}-${item.size}`}
                className="flex justify-between gap-3"
              >
                <span>
                  {products[item.productId]?.name || "Item"} · {item.size} ×{" "}
                  {item.quantity}
                </span>
                <span className="tabular-nums">
                  {products[item.productId]
                    ? formatPrice(
                        (products[item.productId].onSale &&
                        products[item.productId].salePrice != null
                          ? products[item.productId].salePrice!
                          : products[item.productId].price) * item.quantity
                      )
                    : "—"}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between font-semibold border-t border-[var(--line)] pt-4">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-4 leading-relaxed">
            Supports Apple Pay and Google Pay when available on your device.
            Prefer paying on delivery or pickup? Ask staff to open In-person
            POS.
          </p>
        </div>
      </div>
    </div>
  );
}
