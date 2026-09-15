"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckoutPayment } from "@/components/CheckoutPayment";
import { formatPrice } from "@/lib/store-client";
import type { CartItem, Product } from "@/lib/types";

type PosProduct = Product & {
  salePrice?: number;
  onSale?: boolean;
  effectiveSalePercent?: number;
};

function productSizes(product: PosProduct): string[] {
  if (product.sizes?.length) return product.sizes;
  return Object.keys(product.inventory || {});
}

export default function PosPage() {
  const router = useRouter();
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [query, setQuery] = useState("");
  const [ticket, setTicket] = useState<CartItem[]>([]);
  const [email, setEmail] = useState("pickup@culturecloset.com");
  const [done, setDone] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [selected, setSelected] = useState<{
    productId: string;
    size: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then(async (d) => {
        if (d.user?.role !== "admin") {
          router.push("/login");
          return;
        }
        setAuthChecked(true);
        // Prefer admin payload so inventory/sizes are complete
        const admin = await fetch("/api/admin");
        if (admin.ok) {
          const data = await admin.json();
          const storeSale = data.settings?.storeSalePercent ?? 0;
          const priced = (data.products || []).map((p: Product) => {
            const salePercent = Math.max(p.salePercent ?? 0, storeSale);
            const salePrice =
              salePercent > 0
                ? Math.round(p.price * (1 - salePercent / 100) * 100) / 100
                : p.price;
            return {
              ...p,
              salePrice,
              onSale: salePercent > 0,
              effectiveSalePercent: salePercent,
            } as PosProduct;
          });
          setProducts(priced.filter((p: PosProduct) => p.active));
          return;
        }
        const pub = await fetch("/api/products");
        const data = await pub.json();
        setProducts(data.products || []);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return products
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .slice(0, 40);
  }, [products, query]);

  const total = useMemo(() => {
    return ticket.reduce((sum, item) => {
      const p = products.find((x) => x.id === item.productId);
      const unit =
        p?.onSale && p.salePrice != null ? p.salePrice : p?.price ?? 0;
      return sum + unit * item.quantity;
    }, 0);
  }, [ticket, products]);

  function addToTicket(product: PosProduct, size: string) {
    const stock = product.inventory?.[size] ?? 0;
    if (stock <= 0) {
      setNotice(`${product.name} · ${size} is out of stock`);
      return;
    }
    setDone(null);
    setSelected({ productId: product.id, size });
    setNotice(`Added ${product.name} · size ${size}`);
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
    <div className="pos-page">
      <div className="pos-hero">
        <div>
          <p className="admin-kicker">In person</p>
          <h1 className="page-title">Apple Pay POS</h1>
          <p className="admin-sub">
            Tap a size to add it to the ticket, then take Apple Pay face to
            face.
          </p>
        </div>
        <Link href="/admin" className="admin-link-btn">
          Back to inventory
        </Link>
      </div>

      {done && (
        <div className="pos-banner is-success">
          Paid — order <span className="font-mono">{done}</span>. Inventory
          updated.
        </div>
      )}
      {notice && !done && <div className="pos-banner">{notice}</div>}

      <div className="pos-layout">
        <div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="pos-search"
            aria-label="Search products"
          />

          <div className="pos-product-list">
            {filtered.map((p) => {
              const sizes = productSizes(p);
              return (
                <article key={p.id} className="pos-product">
                  <div className="pos-product-top">
                    <div className="pos-product-media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image} alt="" />
                    </div>
                    <div className="pos-product-meta">
                      <p className="pos-product-cat">{p.category}</p>
                      <h2>{p.name}</h2>
                      <p>
                        {p.onSale && p.salePrice != null ? (
                          <>
                            <span className="price-was">
                              {formatPrice(p.price)}
                            </span>{" "}
                            <span className="price-now">
                              {formatPrice(p.salePrice)}
                            </span>
                          </>
                        ) : (
                          formatPrice(p.price)
                        )}
                      </p>
                    </div>
                  </div>

                  <p className="pos-size-label">Select size</p>
                  <div className="pos-size-grid">
                    {sizes.map((s) => {
                      const stock = p.inventory?.[s] ?? 0;
                      const isSelected =
                        selected?.productId === p.id && selected.size === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={stock <= 0}
                          className={`pos-size-btn${isSelected ? " is-active" : ""}`}
                          onClick={() => addToTicket(p, s)}
                        >
                          <span className="pos-size-num">{s}</span>
                          <span className="pos-size-stock">
                            {stock > 0 ? `${stock} left` : "Out"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <p className="admin-empty">No products match that search.</p>
          )}
        </div>

        <aside className="pos-ticket">
          <h2>Ticket</h2>
          {ticket.length === 0 ? (
            <p className="admin-empty">Tap a size to add items.</p>
          ) : (
            <ul className="pos-ticket-list">
              {ticket.map((item) => {
                const p = products.find((x) => x.id === item.productId);
                const unit =
                  p?.onSale && p.salePrice != null
                    ? p.salePrice
                    : p?.price ?? 0;
                return (
                  <li key={`${item.productId}-${item.size}`}>
                    <div>
                      <p className="pos-ticket-name">{p?.name}</p>
                      <p className="pos-ticket-detail">
                        Size {item.size} · Qty {item.quantity} ·{" "}
                        {formatPrice(unit * item.quantity)}
                      </p>
                    </div>
                    <div className="pos-ticket-actions">
                      <button
                        type="button"
                        onClick={() =>
                          setTicket((t) =>
                            t.map((x) =>
                              x.productId === item.productId &&
                              x.size === item.size
                                ? {
                                    ...x,
                                    quantity: Math.max(1, x.quantity - 1),
                                  }
                                : x
                            )
                          )
                        }
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!p) return;
                          addToTicket(p, item.size);
                        }}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="is-danger"
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
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="pos-ticket-total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          <label className="pos-email">
            <span>Customer email (receipt)</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <CheckoutPayment
            items={ticket}
            email={email}
            channel="in_person"
            onSuccess={(orderId) => {
              setTicket([]);
              setSelected(null);
              setNotice(null);
              setDone(orderId);
            }}
          />
        </aside>
      </div>
    </div>
  );
}
