import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Pearls · Harbour hotel",
  description: "Book a room and register with your EUDI wallet. Demo hotel.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <header className="site">
          <Link href="/" className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG */}
            <img src="/logo.svg" alt="" width={32} height={32} />
            <span>The Pearls</span>
          </Link>
          <nav>
            <Link href="/reception">Reception</Link>
          </nav>
        </header>
        {children}
        <footer className="site">Demo hotel for EUDI wallet integration. No real bookings or payments.</footer>
      </body>
    </html>
  );
}
