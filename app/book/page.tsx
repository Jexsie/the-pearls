import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { formatDate, nights, rooms } from "@/lib/hotel";
import { BOOKING_COOKIE, bookings } from "@/lib/store";
import { startOver } from "../actions";
import WalletStep from "../wallet-step";

/** Step 2: the guest registers by sharing data from their PID. */
export default async function Book() {
  const booking = bookings.get((await cookies()).get(BOOKING_COOKIE)?.value);
  if (!booking) redirect("/");
  if (booking.status === "confirmed") redirect("/booking");

  const room = rooms[booking.roomType];
  return (
    <main className="page narrow">
      <p className="steps">1 Room · <strong>2 Your details</strong> · 3 Confirmation</p>
      <section className="card">
        <h1>Your stay</h1>
        <dl className="summary">
          <dt>Room</dt>
          <dd>{room.name}</dd>
          <dt>Dates</dt>
          <dd>
            {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)} ({nights(booking.checkIn, booking.checkOut)} nights)
          </dd>
          <dt>Guests</dt>
          <dd>{booking.guests}</dd>
          <dt>Total</dt>
          <dd>€{booking.total}</dd>
        </dl>
      </section>

      <section className="card">
        <h2>Register with your EUDI wallet</h2>
        <WalletStep
          endpoint="/api/guest-check"
          startLabel="Share my details from my wallet"
          intro={
            <p>
              The law requires us to register every guest. Instead of a form, share your{" "}
              <strong>name, birth date, nationality and address</strong> from your personal ID (PID). Nothing
              else is requested.
            </p>
          }
          waiting="Scan with your wallet and approve the request."
          successHref="/booking"
        />
      </section>

      <form action={startOver}>
        <button type="submit" className="link">
          Start over
        </button>
      </form>
    </main>
  );
}
