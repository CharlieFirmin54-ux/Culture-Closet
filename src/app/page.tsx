import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { getStoreSettings, listProducts } from "@/lib/store";
import { withPricing } from "@/lib/pricing";
import type { Category } from "@/lib/types";

const sections: { key: Category; title: string; href: string }[] = [
  { key: "footwear", title: "Footwear", href: "/catalog?category=footwear" },
  { key: "tracksuits", title: "Tracksuits", href: "/catalog?category=tracksuits" },
  {
    key: "accessories",
    title: "Accessories",
    href: "/catalog?category=accessories",
  },
];

export default async function HomePage() {
  const settings = await getStoreSettings();
  const products = (await listProducts()).map((p) =>
    withPricing(p, settings.storeSalePercent)
  );
  const heroImage =
    products.find((p) => p.slug === "louis-trainer-grey-white")?.image ||
    products.find((p) => p.category === "footwear")?.image ||
    "/products/fw01.jpg";

  return (
    <>
      <section className="hero">
        <div className="hero-media" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImage} alt="" />
          <div className="hero-shade" />
        </div>
        <div className="hero-content">
          <p className="hero-kicker">
            {settings.storeSalePercent > 0
              ? `Store sale · ${settings.storeSalePercent}% off`
              : "Private edit · Seasonless"}
          </p>
          <h1 className="hero-brand">Culture Closet</h1>
          <p className="hero-line">
            Selected trainers and sets. Quiet presentation. No noise.
          </p>
          <div className="hero-cta">
            <Link href="/catalog" className="btn-solid">
              Enter the edit
            </Link>
            <Link href="/catalog?category=footwear" className="btn-ghost">
              Footwear
            </Link>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="shop-intro">
          <p className="shop-intro-label">The house</p>
          <p>
            A restrained selection of footwear, tracksuits and accessories —
            photographed as worn, sold as owned. Apple Pay and Google Pay
            online; Apple Pay in person on pickup and delivery.
          </p>
        </div>

        {sections.map((section) => {
          const items = products.filter((p) => p.category === section.key);
          if (!items.length) return null;
          return (
            <section key={section.key} className="section">
              <div className="section-head">
                <h2 className="section-title">{section.title}</h2>
                <Link href={section.href} className="section-link">
                  View all
                </Link>
              </div>
              <div className="product-grid">
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
