import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductBuyBox } from "@/components/ProductBuyBox";
import { ProductCard } from "@/components/ProductCard";
import { getProductBySlug, getStoreSettings, listProducts } from "@/lib/store";
import { withPricing } from "@/lib/pricing";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const settings = await getStoreSettings();
  const raw = await getProductBySlug(slug);
  if (!raw) notFound();
  const product = withPricing(raw, settings.storeSalePercent);

  const related = (await listProducts({ category: product.category }))
    .filter((p) => p.id !== product.id)
    .slice(0, 4)
    .map((p) => withPricing(p, settings.storeSalePercent));

  return (
    <div className="container">
      <nav
        style={{
          fontSize: 12,
          color: "var(--muted)",
          marginBottom: "1.75rem",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        <Link href="/">Home</Link>
        <span style={{ margin: "0 0.5rem" }}>/</span>
        <Link href="/catalog">Catalog</Link>
        <span style={{ margin: "0 0.5rem" }}>/</span>
        <span>{product.name}</span>
      </nav>

      <div
        style={{
          display: "grid",
          gap: "2.5rem",
          alignItems: "start",
        }}
        className="pdp-grid"
      >
        <div className="product-card-media" style={{ marginBottom: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt={product.name} />
          {product.onSale ? (
            <span className="sale-badge">−{product.effectiveSalePercent}%</span>
          ) : null}
        </div>
        <ProductBuyBox product={product} />
      </div>

      {related.length > 0 && (
        <section className="section" style={{ marginTop: "4.5rem" }}>
          <div className="section-head">
            <h2
              className="section-title"
              style={{ fontSize: "clamp(2rem,6vw,3.5rem)" }}
            >
              More from the edit
            </h2>
          </div>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
      <style>{`
        @media (min-width: 1024px) {
          .pdp-grid {
            grid-template-columns: 1.15fr 0.85fr !important;
            gap: 4rem !important;
          }
        }
      `}</style>
    </div>
  );
}
