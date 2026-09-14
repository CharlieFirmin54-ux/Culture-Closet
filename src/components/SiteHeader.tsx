"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useState } from "react";
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

  return (
    <header className="site-header">
      <div className="site-banner">
        Private client line ·{" "}
        <a href="https://wa.me/447359938605">WhatsApp 07359938605</a>
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/firmin-mark-sm.png"
            alt=""
            className="site-logo-mark"
            width={32}
            height={32}
          />
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
          action="/catalog"
          onSubmit={() => setSearchOpen(false)}
          style={{
            padding: "0 1rem 1rem",
            maxWidth: 1440,
            margin: "0 auto",
            width: "100%",
          }}
        >
          <input
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the edit…"
            style={{
              width: "100%",
              border: "1px solid var(--line)",
              background: "var(--panel)",
              padding: "0.95rem 1.1rem",
              outline: "none",
              letterSpacing: "0.04em",
              fontSize: "0.9rem",
            }}
            autoFocus
          />
        </form>
      )}

      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(0,0,0,0.5)",
          }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            style={{
              width: "82%",
              maxWidth: 360,
              height: "100%",
              background: "var(--bg)",
              padding: "1.75rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "2.5rem",
                alignItems: "center",
              }}
            >
              <span
                className="site-logo"
                style={{ fontSize: "0.85rem", textIndent: 0, letterSpacing: "0.28em" }}
              >
                Menu
              </span>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setMobileOpen(false)}
                style={{ border: 0, background: "transparent" }}
              >
                <X size={22} />
              </button>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                fontSize: "0.95rem",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                fontWeight: 600,
              }}
            >
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
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
