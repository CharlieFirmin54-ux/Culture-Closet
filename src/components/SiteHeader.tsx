"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/lib/cart";

const links = [
  { href: "/catalog", label: "Shop" },
  { href: "/catalog?category=footwear", label: "Footwear" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({
  userName,
  isAdmin,
}: {
  userName?: string | null;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const { count, openCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const mobileMenu =
    mounted &&
    mobileOpen &&
    createPortal(
      <div className="mobile-nav" role="dialog" aria-modal="true" aria-label="Menu">
        <button
          type="button"
          className="mobile-nav-backdrop"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
        <aside className="mobile-nav-panel">
          <div className="mobile-nav-top">
            <p className="mobile-nav-label">Menu</p>
            <button
              type="button"
              className="mobile-nav-close"
              aria-label="Close"
              onClick={() => setMobileOpen(false)}
            >
              <X size={22} strokeWidth={1.5} />
            </button>
          </div>
          <nav className="mobile-nav-links">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              {userName ? "Account" : "Log in"}
            </Link>
            {isAdmin && (
              <Link href="/admin" onClick={() => setMobileOpen(false)}>
                Admin
              </Link>
            )}
          </nav>
          <p className="mobile-nav-note">
            Private client line ·{" "}
            <a href="https://wa.me/447359938605">WhatsApp</a>
          </p>
        </aside>
      </div>,
      document.body
    );

  return (
    <header className="site-header">
      <div className="site-banner">
        Appointments &amp; private client line ·{" "}
        <a href="https://wa.me/447359938605">WhatsApp</a>
      </div>

      <div className="site-header-inner">
        <nav className="site-nav">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={pathname === l.href ? "is-active" : undefined}
            >
              {l.label}
            </Link>
          ))}
          {isAdmin && <Link href="/admin">Admin</Link>}
        </nav>

        <button
          type="button"
          className="site-menu-btn"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={22} strokeWidth={1.5} />
        </button>

        <Link href="/" className="site-logo" aria-label="Culture Closet home">
          <span className="site-logo-text">Culture Closet</span>
        </Link>

        <div className="site-actions">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search size={20} strokeWidth={1.5} />
          </button>
          <Link
            href={userName ? "/account" : "/login"}
            aria-label={userName ? "Account" : "Log in"}
            title={userName || "Log in"}
          >
            <User size={20} strokeWidth={1.5} />
          </Link>
          <button type="button" aria-label="Open cart" onClick={openCart}>
            <ShoppingBag size={20} strokeWidth={1.5} />
            {count > 0 && <span className="cart-badge">{count}</span>}
          </button>
        </div>
      </div>

      {searchOpen && (
        <form
          className="site-search"
          action="/catalog"
          onSubmit={() => setSearchOpen(false)}
        >
          <input
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the edit…"
            autoFocus
          />
        </form>
      )}

      {mobileMenu}
    </header>
  );
}
