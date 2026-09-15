"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/store-client";

export function ProductCard({
  product,
}: {
  product: {
    slug: string;
    name: string;
    price: number;
    image: string;
    category?: string;
    salePercent?: number;
    storeSalePercent?: number;
    salePrice?: number;
    onSale?: boolean;
    effectiveSalePercent?: number;
  };
}) {
  const onSale = Boolean(product.onSale && (product.salePrice ?? product.price) < product.price);
  const display = onSale ? (product.salePrice as number) : product.price;

  return (
    <Link href={`/products/${product.slug}`} className="product-card">
      <div className="product-card-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} loading="lazy" />
        {onSale && product.effectiveSalePercent ? (
          <span className="sale-badge">−{product.effectiveSalePercent}%</span>
        ) : null}
      </div>
      {product.category ? (
        <p className="product-card-cat">{product.category}</p>
      ) : null}
      <div className="product-card-meta">
        <h3>{product.name}</h3>
        <p className={onSale ? "has-sale" : undefined}>
          {onSale ? (
            <>
              <span className="price-was">{formatPrice(product.price)}</span>{" "}
              <span className="price-now">{formatPrice(display)}</span>
            </>
          ) : (
            formatPrice(product.price)
          )}
        </p>
      </div>
    </Link>
  );
}
