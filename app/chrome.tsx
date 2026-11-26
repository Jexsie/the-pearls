import Link from "next/link";
import { hotel } from "@/lib/hotel";
import { Icon } from "./icons";

/** Pearl-dot monogram and serif wordmark ("Logo / The Pearls"). */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span className="brand" style={{ fontSize: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG */}
      <img src="/logo.svg" alt="" width={size} height={size} />
      <span>
        <em>The</em> Pearls
      </span>
    </span>
  );
}

/** Header of the marketing pages. */
export function SiteHeader() {
  return (
    <header className="site">
      <div className="site-inner">
        <Link href="/" aria-label="The Pearls, home">
          <Logo />
        </Link>
        <nav aria-label="Main">
          <Link href="/#rooms">Rooms &amp; Suites</Link>
          <Link href="/reception">Reception</Link>
        </nav>
      </div>
    </header>
  );
}

const steps = ["Your stay", "Registration", "Confirmation"];

/** Header of the booking steps: back link, logo, phone; then the stepper. */
export function CheckoutHeader({ step }: { step: 1 | 2 | 3 }) {
  return (
    <>
      <header className="checkout">
        <Link href="/#rooms" className="back">
          <span className="flip">
            <Icon name="arrow" size={16} />
          </span>
          Rooms &amp; Suites
        </Link>
        <Link href="/" aria-label="The Pearls, home" className="checkout-logo">
          <Logo />
        </Link>
        <p className="help">
          Questions? <a href={`tel:${hotel.phone.replace(/\s/g, "")}`}>{hotel.phone}</a>
        </p>
      </header>
      <ol className="stepper" aria-label="Booking steps">
        {steps.map((label, i) => (
          <li
            key={label}
            aria-current={i + 1 === step ? "step" : undefined}
            className={i + 1 < step ? "done" : undefined}
          >
            {i + 1 < step && <Icon name="check" size={14} />}
            {label}
          </li>
        ))}
      </ol>
    </>
  );
}

const footerColumns: [string, string[]][] = [
  ["Stay", ["Rooms & Suites", "Offers", "Gift a stay"]],
  ["Hotel", ["Dining", "Spa", "The Lake"]],
  ["Contact", ["Reservations", "Press", "Careers"]],
];

export function SiteFooter() {
  return (
    <footer className="site">
      <div className="footer-top">
        <div className="footer-brand">
          <Logo size={26} />
          <p>
            {hotel.address}
            <br />
            Reception, day and night · {hotel.phone}
          </p>
        </div>
        {/* Not links: the demo has none of these pages. */}
        <div className="footer-cols">
          {footerColumns.map(([title, items]) => (
            <div key={title}>
              <p className="eyebrow">{title}</p>
              <ul>
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2027 The Pearls Hotel S.r.l. · Demo hotel: no real bookings or payments.</p>
        <p className="seal">
          <Icon name="seal" size={16} /> Check in with your EU Digital Identity Wallet
        </p>
      </div>
    </footer>
  );
}
