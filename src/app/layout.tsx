import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { CartProvider } from "@/lib/cart";
import { getSession } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CartDrawer } from "@/components/CartDrawer";
import "./globals.css";

const display = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

const body = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Culture Closet | Essentials",
  description:
    "Culture Closet — curated footwear, sets and accessories. Apple Pay & Google Pay online; Apple Pay in person for pickup and delivery.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en-GB" className={`${display.variable} ${body.variable}`}>
      <body className="shell">
        <CartProvider>
          <SiteHeader
            userName={session?.name}
            isAdmin={session?.role === "admin"}
          />
          <main className="shell-main">{children}</main>
          <SiteFooter />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
