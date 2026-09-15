import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <p className="footer-brand">Culture Closet</p>
          <p>
            A private UK streetwear house. Appointments, pickup and delivery —
            Apple Pay in person when you need it.
          </p>
        </div>
        <div className="footer-col">
          <strong>The edit</strong>
          <Link href="/catalog?category=footwear">Footwear</Link>
          <Link href="/catalog?category=tracksuits">Tracksuits</Link>
          <Link href="/catalog?category=accessories">Accessories</Link>
        </div>
        <div className="footer-col">
          <strong>Client services</strong>
          <Link href="/contact">Contact</Link>
          <Link href="/login">Account</Link>
          <a href="https://wa.me/447359938605" target="_blank" rel="noreferrer">
            WhatsApp
          </a>
        </div>
      </div>

      <div className="footer-house">
        <p className="footer-house-label">A Firmin Systems house</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/firmin-lockup-md.png"
          alt="Firmin Systems — Building a smarter tomorrow"
          className="footer-house-lockup"
          width={220}
          height={220}
        />
      </div>

      <div className="site-footer-copy">
        © {new Date().getFullYear()} Culture Closet · Firmin Systems
      </div>
    </footer>
  );
}
