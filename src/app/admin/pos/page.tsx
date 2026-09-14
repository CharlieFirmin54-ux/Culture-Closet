"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckoutPayment } from "@/components/CheckoutPayment";
import { formatPrice } from "@/lib/store-client";
import type { CartItem, Product } from "@/lib/types";

export default function PosPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [ticket, setTicket] = useState<CartItem[]>([]);
  const [email, setEmail] = useState("pickup@culturecloset.com");
  const [done, setDone] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.role !== "admin") {
          router.push("/login");
          return;
        }
        setAuthChecked(true);
      });
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []));
  }, [router]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 24);
  }, [products, query]);

  const total = useMemo(() => {
    return ticket.reduce((sum, item) => {
      const p = products.find((x) => x.id === item.productId);
      return sum + (p?.price ?? 0) * item.quantity;
    }, 0);
  }, [ticket, products]);

  function addToTicket(product: Product, size: string) {
    setDone(null);
    setTicket((prev) => {
      const idx = prev.findIndex(
        (i) => i.productId === product.id && i.size === size
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { productId: product.id, size, quantity: 1 }];
    });
  }

  if (!authChecked) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-sm text-[var(--muted)]">
        Checking admin access…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="page-title text-[2.75rem]">In-person POS</h1>
          <p className="text-sm text-[var(--muted)] mt-2 max-w-xl">
            For delivery handoff or store pickup. Open this page on an iPhone
            with Apple Pay, build the ticket, then take payment face-to-face.
          </p>
        </div>
        <Link href="/admin" className="text-sm underline">
          Back to inventory
        </Link>
      </div>

      {done && (
        <div className="mb-6 border border-emerald-800/30 bg-emerald-50 px-4 py-3 text-sm">
          Paid — order <span className="font-mono">{done}</span>. Inventory
          updated.
        </div>
      )}

      <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-8">
        <div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="w-full border border-[var(--line)] px-3 py-3 mb-5 outline-none focus:border-ink"
          />
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((p) => (
              <div key={p.id} className="border border-[var(--line)] p-3">
                <div className="flex gap-3">
                  <div className="relative w-16 h-20 bg-[var(--soft)] overflow-hidden shrink-0">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-sm">{formatPrice(p.price)}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.sizes.map((s) => {
                        const stock = p.inventory[s] ?? 0;
                        return (
                          <button
                            key={s}
                            type="button"
                            disabled={stock <= 0}
                            className="text-[11px] border border-ink px-2 py-1 disabled:opacity-30"
                            onClick={() => addToTicket(p, s)}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[var(--line)] p-5 h-fit sticky top-28 space-y-4">
          <h2 className="font-semibold">Ticket</h2>
          {ticket.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Tap a size to add items.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {ticket.map((item) => {
                const p = products.find((x) => x.id === item.productId);
                return (
                  <li
                    key={`${item.productId}-${item.size}`}
                    className="flex justify-between gap-2"
                  >
                    <span>
                      {p?.name} · {item.size} × {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="underline text-xs text-[var(--muted)]"
                      onClick={() =>
                        setTicket((t) =>
                          t.filter(
                            (x) =>
                              !(
                                x.productId === item.productId &&
                                x.size === item.size
                              )
                          )
                        )
                      }
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex justify-between font-semibold border-t border-[var(--line)] pt-3">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block">Customer email (receipt)</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[var(--line)] px-3 py-2 outline-none focus:border-ink"
            />
          </label>
          <CheckoutPayment
            items={ticket}
            email={email}
            channel="in_person"
            onSuccess={(orderId) => {
              setTicket([]);
              setDone(orderId);
            }}
          />
        </div>
      </div>
    </div>
  );
}
