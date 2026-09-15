"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, totalUnits } from "@/lib/store-client";
import type { Order, Product } from "@/lib/types";

type AdminProduct = Product & { units: number };

export default function AdminPage() {
  const router = useRouter();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, number>>>(
    {}
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<
    "all" | "footwear" | "tracksuits" | "accessories"
  >("all");
  const [status, setStatus] = useState<"all" | "live" | "hidden">("all");

  async function load() {
    const res = await fetch("/api/admin");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setProducts(data.products || []);
    setOrders(data.orders || []);
    const next: Record<string, Record<string, number>> = {};
    for (const p of data.products || []) {
      next[p.id] = { ...p.inventory };
    }
    setDrafts(next);
  }

  useEffect(() => {
    load().catch(() => setError("Failed to load admin data"));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (status === "live" && !p.active) return false;
      if (status === "hidden" && p.active) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [products, query, category, status]);

  function isDirty(product: AdminProduct) {
    const draft = drafts[product.id] || {};
    const sizes = new Set([
      ...Object.keys(product.inventory),
      ...Object.keys(draft),
    ]);
    for (const size of sizes) {
      if ((draft[size] ?? 0) !== (product.inventory[size] ?? 0)) return true;
    }
    return false;
  }

  function setQty(productId: string, size: string, value: number) {
    const next = Math.max(0, Math.min(9999, Number.isFinite(value) ? value : 0));
    setDrafts((d) => ({
      ...d,
      [productId]: {
        ...d[productId],
        [size]: next,
      },
    }));
    setSavedId(null);
  }

  function bump(productId: string, size: string, delta: number) {
    const current = drafts[productId]?.[size] ?? 0;
    setQty(productId, size, current + delta);
  }

  async function patch(body: Record<string, unknown>, productId?: string) {
    const key = String(productId || body.productId || body.action);
    setSaving(key);
    setError(null);
    const res = await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(null);
    if (!res.ok) {
      setError(data.error || "Update failed");
      return;
    }
    if (body.action === "inventory" && productId) {
      setSavedId(productId);
      setTimeout(() => setSavedId((id) => (id === productId ? null : id)), 1800);
    }
    await load();
  }

  return (
    <div className="admin-page">
      <div className="admin-hero">
        <div>
          <p className="admin-kicker">Back office</p>
          <h1 className="page-title">Inventory</h1>
          <p className="admin-sub">
            Adjust stock by size, hide pieces from the shop, or jump to POS.
          </p>
        </div>
        <div className="admin-hero-actions">
          <Link href="/admin/pos" className="btn-dark">
            Apple Pay POS
          </Link>
          <Link href="/catalog" className="admin-link-btn">
            View shop
          </Link>
        </div>
      </div>

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-toolbar">
        <input
          className="admin-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          aria-label="Search products"
        />
        <div className="admin-filters">
          {(
            [
              ["all", "All"],
              ["footwear", "Footwear"],
              ["tracksuits", "Tracksuits"],
              ["accessories", "Accessories"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`admin-chip${category === value ? " is-active" : ""}`}
              onClick={() => setCategory(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="admin-filters">
          {(
            [
              ["all", "Any status"],
              ["live", "Live"],
              ["hidden", "Hidden"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`admin-chip${status === value ? " is-active" : ""}`}
              onClick={() => setStatus(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="admin-count">
        {filtered.length} product{filtered.length === 1 ? "" : "s"}
      </p>

      <div className="admin-list">
        {filtered.map((p) => {
          const draft = drafts[p.id] || p.inventory;
          const dirty = isDirty(p);
          const units = totalUnits(draft);
          return (
            <article
              key={p.id}
              className={`admin-card${!p.active ? " is-hidden" : ""}${
                dirty ? " is-dirty" : ""
              }`}
            >
              <div className="admin-card-top">
                <div className="admin-card-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" />
                </div>
                <div className="admin-card-meta">
                  <p className="admin-card-cat">{p.category}</p>
                  <h2>{p.name}</h2>
                  <p className="admin-card-price">
                    {formatPrice(p.price)} · {units} unit{units === 1 ? "" : "s"}
                  </p>
                  <span
                    className={`admin-status${p.active ? " is-live" : ""}`}
                  >
                    {p.active ? "Live in shop" : "Hidden"}
                  </span>
                </div>
              </div>

              <div className="admin-stock">
                <div className="admin-stock-head">
                  <p>Stock by size</p>
                  {dirty && <span className="admin-unsaved">Unsaved</span>}
                  {savedId === p.id && !dirty && (
                    <span className="admin-saved">Saved</span>
                  )}
                </div>
                <div className="admin-size-grid">
                  {Object.entries(draft).map(([size, qty]) => (
                    <div key={size} className="admin-size-row">
                      <span className="admin-size-label">{size}</span>
                      <div className="admin-stepper">
                        <button
                          type="button"
                          aria-label={`Decrease ${size}`}
                          onClick={() => bump(p.id, size, -1)}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={qty}
                          onChange={(e) =>
                            setQty(p.id, size, Number(e.target.value))
                          }
                          aria-label={`${p.name} size ${size} stock`}
                        />
                        <button
                          type="button"
                          aria-label={`Increase ${size}`}
                          onClick={() => bump(p.id, size, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-card-actions">
                <button
                  type="button"
                  className="btn-dark admin-save"
                  disabled={!dirty || saving === p.id}
                  onClick={() =>
                    patch(
                      {
                        action: "inventory",
                        productId: p.id,
                        inventory: draft,
                      },
                      p.id
                    )
                  }
                >
                  {saving === p.id ? "Saving…" : "Save stock"}
                </button>
                <button
                  type="button"
                  className="admin-text-btn"
                  disabled={saving === p.id}
                  onClick={() =>
                    patch({
                      action: "active",
                      productId: p.id,
                      active: !p.active,
                    })
                  }
                >
                  {p.active ? "Hide from shop" : "Show in shop"}
                </button>
                <button
                  type="button"
                  className="admin-text-btn is-danger"
                  disabled={saving === p.id}
                  onClick={() => {
                    if (
                      confirm(
                        `Permanently remove “${p.name}”? This cannot be undone.`
                      )
                    ) {
                      patch({ action: "remove", productId: p.id });
                    }
                  }}
                >
                  Remove
                </button>
                <Link href={`/products/${p.slug}`} className="admin-text-btn">
                  Open PDP
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="admin-empty">No products match those filters.</p>
      )}

      <section className="admin-orders">
        <h2>Recent orders</h2>
        {orders.length === 0 ? (
          <p className="admin-empty">No orders yet.</p>
        ) : (
          <div className="admin-order-list">
            {orders.slice(0, 20).map((o) => (
              <div key={o.id} className="admin-order">
                <div>
                  <p className="admin-order-id">{o.id}</p>
                  <p>
                    {o.email} · {o.channel.replace("_", " ")} ·{" "}
                    {o.paymentMethod.replaceAll("_", " ")}
                  </p>
                  <p className="admin-order-items">
                    {o.items
                      .map((i) => `${i.name} (${i.size})×${i.quantity}`)
                      .join(", ")}
                  </p>
                </div>
                <div className="admin-order-total">
                  <p>{formatPrice(o.total)}</p>
                  <p>{new Date(o.createdAt).toLocaleString("en-GB")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
