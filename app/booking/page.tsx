import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDate, hotel, nights, rooms } from "@/lib/hotel";
import { BOOKING_COOKIE, bookings } from "@/lib/store";
import { startOver } from "../actions";
import WalletStep from "../wallet-step";

/** Step 3: confirmed booking, then the booking credential goes into the wallet. */
export default async function Confirmation() {
  const booking = bookings.get((await cookies()).get(BOOKING_COOKIE)?.value);
  if (!booking) redirect("/");
  if (booking.status !== "confirmed" || !booking.guest) redirect("/book");

  const { guest } = booking;
  const address = [guest.address.street_address, `${guest.address.postal_code ?? ""} ${guest.address.locality ?? ""}`.trim(), guest.address.country]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="page narrow">
      <p className="steps">1 Room · 2 Your details · <strong>3 Confirmation</strong></p>
      <section className="card">
        <p className="ok">✓ Booking confirmed</p>
        <h1>
          See you soon, {guest.givenName.charAt(0)}
          {guest.givenName.slice(1).toLowerCase()}!
        </h1>
        <dl className="summary">
          <dt>Booking number</dt>
          <dd>
            <strong>{booking.id}</strong>
          </dd>
          <dt>Room</dt>
          <dd>{rooms[booking.roomType].name}</dd>
          <dt>Dates</dt>
          <dd>
            {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)} ({nights(booking.checkIn, booking.checkOut)} nights)
          </dd>
          <dt>Guests</dt>
          <dd>{booking.guests}</dd>
          <dt>Total</dt>
          <dd>€{booking.total} · pay at the hotel</dd>
        </dl>
      </section>

      <section className="card">
        <h2>Guest registration</h2>
        <p className="muted">Filled in from your verified ID, no typing needed.</p>
        <dl className="summary">
          <dt>Name</dt>
          <dd>
            {guest.givenName} {guest.familyName}
          </dd>
          <dt>Born</dt>
          <dd>{formatDate(guest.birthdate)}</dd>
          <dt>Nationality</dt>
          <dd>{guest.nationality}</dd>
          <dt>Address</dt>
          <dd>{address}</dd>
        </dl>
      </section>

      <section className="card">
        <h2>Add your booking to your wallet</h2>
        <WalletStep
          endpoint="/api/booking-credential"
          startLabel="Add booking to my wallet"
          intro={
            <p>
              Your booking becomes a document in your wallet, signed by {hotel.name}. Show it at reception on
              arrival: no booking number, no paperwork.
            </p>
          }
          waiting="Scan with your wallet to add the booking."
          restartLabel="Add it again"
        />
      </section>

      <p className="muted center">
        Arriving now? Go to <Link href="/reception">reception check-in</Link>.
      </p>
      <form action={startOver}>
        <button type="submit" className="link">
          Make another booking
        </button>
      </form>
    </main>
  );
}
