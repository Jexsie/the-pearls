import Link from "next/link";
import { hotel } from "@/lib/hotel";
import WalletStep from "../wallet-step";

/** The lobby tablet: arriving guests check in with the booking in their wallet. */
export default function Reception() {
  return (
    <main className="page narrow">
      <section className="card">
        <p className="eyebrow">Reception</p>
        <h1>Check in at {hotel.name}</h1>
        <WalletStep
          endpoint="/api/reception"
          startLabel="Check in with my wallet"
          intro={<p>Show the booking from your EUDI wallet. We check it and hand you your room.</p>}
          waiting="Scan with your wallet and share your booking."
          restartLabel="Next guest"
        />
      </section>
      <p className="muted center">
        <Link href="/">← Book a room</Link>
      </p>
    </main>
  );
}
