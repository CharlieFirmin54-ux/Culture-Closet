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
  };
}) {
  return (
    <Link href={`/products/${product.slug}`} className="product-card">
      <div className="product-card-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} loading="lazy" />
      </div>
      {product.category ? (
        <p className="product-card-cat">{product.category}</p>
      ) : null}
      <div className="product-card-meta">
        <h3>{product.name}</h3>
        <p>{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
