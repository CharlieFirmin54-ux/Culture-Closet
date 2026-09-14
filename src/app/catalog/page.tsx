import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { listProducts } from "@/lib/store";
import type { Category } from "@/lib/types";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; availability?: string }>;
}) {
  const sp = await searchParams;
  const category = sp.category as Category | undefined;
  let products = await listProducts({ category });

  if (sp.q) {
    const q = sp.q.toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(q));
  }

  if (sp.availability === "in_stock") {
    products = products.filter((p) =>
      Object.values(p.inventory).some((n) => n > 0)
    );
  }

  const filters = [
    { href: "/catalog", label: "All" },
    { href: "/catalog?category=footwear", label: "Footwear" },
    { href: "/catalog?category=tracksuits", label: "Tracksuits" },
    { href: "/catalog?category=accessories", label: "Accessories" },
  ];

  return (
    <div className="container">
      <div className="section-head" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">The Edit</h1>
          <p style={{ margin: "0.65rem 0 0", color: "var(--muted)", fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {products.length} pieces
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "2rem",
        }}
      >
        {filters.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            style={{
              padding: "0.7rem 1rem",
              border: "1px solid var(--line)",
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontWeight: 600,
              background: "var(--panel)",
            }}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No products found.</p>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
