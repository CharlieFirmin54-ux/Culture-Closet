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

function unitPrice(p: PosProduct | undefined): number {
  if (!p) return 0;
  return p.onSale && p.salePrice != null ? p.salePrice : p.price;
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

  const ticketQty = useMemo(
    () => ticket.reduce((sum, item) => sum + item.quantity, 0),
    [ticket]
  );

  const total = useMemo(() => {
    return ticket.reduce((sum, item) => {
      const p = products.find((x) => x.id === item.productId);
      return sum + unitPrice(p) * item.quantity;
    }, 0);
  }, [ticket, products]);

  function ticketQtyFor(productId: string, size: string) {
    return (
      ticket.find((i) => i.productId === productId && i.size === size)
        ?.quantity ?? 0
    );
  }

  function addToTicket(product: PosProduct, size: string) {
    const stock = product.inventory?.[size] ?? 0;
    const onTicket = ticketQtyFor(product.id, size);
    if (stock <= 0) {
      setNotice(`${product.name} · ${size} is out of stock`);
      return;
    }
    if (onTicket >= stock) {
      setNotice(`Only ${stock} left in ${product.name} · ${size}`);
      return;
    }
    setDone(null);
    setSelected({ productId: product.id, size });
    setNotice(
      onTicket === 0
        ? `Added ${product.name} · size ${size}`
        : `Updated ${product.name} · size ${size} × ${onTicket + 1}`
    );
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

  function setQty(productId: string, size: string, quantity: number) {
    const product = products.find((p) => p.id === productId);
    const stock = product?.inventory?.[size] ?? 0;
    if (quantity <= 0) {
      setTicket((t) =>
        t.filter((x) => !(x.productId === productId && x.size === size))
      );
      return;
    }
    const nextQty = Math.min(quantity, stock);
    if (quantity > stock) {
      setNotice(
        `Only ${stock} left in ${product?.name || "item"} · ${size}`
      );
    }
    setTicket((prev) =>
      prev.map((x) =>
        x.productId === productId && x.size === size
          ? { ...x, quantity: nextQty }
          : x
      )
    );
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
            Tap sizes to build a multi-item ticket, then take one Apple Pay for
            the full total.
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

                  <p className="pos-size-label">Tap a size to add</p>
                  <div className="pos-size-grid">
                    {sizes.map((s) => {
                      const stock = p.inventory?.[s] ?? 0;
                      const onTicket = ticketQtyFor(p.id, s);
                      const isSelected =
                        selected?.productId === p.id && selected.size === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={stock <= 0 || onTicket >= stock}
                          className={`pos-size-btn${isSelected || onTicket > 0 ? " is-active" : ""}`}
                          onClick={() => addToTicket(p, s)}
                        >
                          <span className="pos-size-num">{s}</span>
                          <span className="pos-size-stock">
                            {onTicket > 0
                              ? `${onTicket} on ticket`
                              : stock > 0
                                ? `${stock} left`
                                : "Out"}
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
          <div className="pos-ticket-head">
            <h2>Ticket</h2>
            {ticketQty > 0 && (
              <span className="pos-ticket-count">
                {ticketQty} item{ticketQty === 1 ? "" : "s"}
              </span>
            )}
          </div>
          {ticket.length === 0 ? (
            <p className="admin-empty">
              Tap sizes to add as many products as you need.
            </p>
          ) : (
            <ul className="pos-ticket-list">
              {ticket.map((item) => {
                const p = products.find((x) => x.id === item.productId);
                const unit = unitPrice(p);
                const stock = p?.inventory?.[item.size] ?? 0;
                return (
                  <li key={`${item.productId}-${item.size}`}>
                    <div>
                      <p className="pos-ticket-name">{p?.name}</p>
                      <p className="pos-ticket-detail">
                        Size {item.size} · {formatPrice(unit)} each ·{" "}
                        {formatPrice(unit * item.quantity)}
                      </p>
                    </div>
                    <div className="pos-ticket-actions">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() =>
                          setQty(item.productId, item.size, item.quantity - 1)
                        }
                      >
                        −
                      </button>
                      <span className="pos-ticket-qty">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={item.quantity >= stock}
                        onClick={() =>
                          setQty(item.productId, item.size, item.quantity + 1)
                        }
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

          {ticket.length > 0 && (
            <button
              type="button"
              className="pos-clear-ticket"
              onClick={() => {
                setTicket([]);
                setSelected(null);
                setNotice(null);
              }}
            >
              Clear ticket
            </button>
          )}

          <div className="pos-ticket-total">
            <span>Total ({ticketQty})</span>
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
