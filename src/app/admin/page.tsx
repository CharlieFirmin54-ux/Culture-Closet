"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, totalUnits } from "@/lib/store-client";
import type { Order, Product } from "@/lib/types";

type AdminProduct = Product & { units: number };

export default function AdminPage() {
  const router = useRouter();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, number>>>(
    {}
  );

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

  async function patch(body: Record<string, unknown>) {
    setSaving(String(body.productId || body.action));
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
    await load();
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="text-sm text-[var(--muted)] mt-2">
            Track stock by size, hide items, or remove products.
          </p>
        </div>
        <Link
          href="/admin/pos"
          className="btn-dark inline-flex items-center px-5 text-sm"
        >
          In-person Apple Pay POS
        </Link>
      </div>

      {error && <p className="text-sm text-red-700 mb-4">{error}</p>}

      <div className="overflow-x-auto border border-[var(--line)]">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-[var(--soft)] text-left">
            <tr>
              <th className="p-3 font-semibold">Product</th>
              <th className="p-3 font-semibold">Price</th>
              <th className="p-3 font-semibold">Units</th>
              <th className="p-3 font-semibold">Stock by size</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-[var(--line)] align-top">
                <td className="p-3">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-[var(--muted)] capitalize">
                    {p.category}
                  </p>
                </td>
                <td className="p-3 tabular-nums">{formatPrice(p.price)}</td>
                <td className="p-3 tabular-nums">
                  {totalUnits(drafts[p.id] || p.inventory)}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2 max-w-md">
                    {Object.entries(drafts[p.id] || p.inventory).map(
                      ([size, qty]) => (
                        <label
                          key={size}
                          className="flex items-center gap-1 text-xs border border-[var(--line)] px-2 py-1"
                        >
                          <span className="font-medium w-10">{size}</span>
                          <input
                            type="number"
                            min={0}
                            className="w-14 border-0 outline-none bg-transparent"
                            value={qty}
                            onChange={(e) =>
                              setDrafts((d) => ({
                                ...d,
                                [p.id]: {
                                  ...d[p.id],
                                  [size]: Number(e.target.value),
                                },
                              }))
                            }
                          />
                        </label>
                      )
                    )}
                  </div>
                  <button
                    type="button"
                    className="mt-2 text-xs underline"
                    disabled={saving === p.id}
                    onClick={() =>
                      patch({
                        action: "inventory",
                        productId: p.id,
                        inventory: drafts[p.id],
                      })
                    }
                  >
                    {saving === p.id ? "Saving…" : "Save stock"}
                  </button>
                </td>
                <td className="p-3">
                  <span
                    className={
                      p.active
                        ? "text-emerald-800"
                        : "text-[var(--muted)]"
                    }
                  >
                    {p.active ? "Live" : "Hidden"}
                  </span>
                </td>
                <td className="p-3 space-y-2">
                  <button
                    type="button"
                    className="block text-xs underline"
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
                    className="block text-xs underline text-red-700"
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
                    Remove product
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-14">
        <h2 className="text-xl font-semibold mb-4">Recent orders</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 20).map((o) => (
              <div
                key={o.id}
                className="border border-[var(--line)] p-4 text-sm flex flex-col sm:flex-row sm:justify-between gap-2"
              >
                <div>
                  <p className="font-medium font-mono">{o.id}</p>
                  <p className="text-[var(--muted)]">
                    {o.email} · {o.channel.replace("_", " ")} ·{" "}
                    {o.paymentMethod.replaceAll("_", " ")}
                  </p>
                  <p className="text-xs mt-1">
                    {o.items
                      .map((i) => `${i.name} (${i.size})×${i.quantity}`)
                      .join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(o.total)}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {new Date(o.createdAt).toLocaleString("en-GB")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
