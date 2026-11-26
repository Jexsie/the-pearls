import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { displayName, formatDate, formatLongDate, rooms } from "@/lib/hotel";
import { BOOKING_COOKIE, bookings } from "@/lib/store";
import { startOver } from "../actions";
import { CheckoutHeader, SiteFooter } from "../chrome";
import { Icon } from "../icons";
import StaySummary from "../stay-summary";
import IssuePanel from "./issue-panel";

/** Step 3: confirmed booking, then the booking credential goes into the wallet. */
export default async function Confirmation() {
  const booking = bookings.get((await cookies()).get(BOOKING_COOKIE)?.value);
  if (!booking) redirect("/");
  if (booking.status !== "confirmed" || !booking.guest) redirect("/book");

  const firstName = displayName(booking.guest.givenName);
  const room = rooms[booking.roomType];

  return (
    <>
      <CheckoutHeader step={3} />
      <main className="confirmed">
        <section className="confirmation">
          <div className="message">
            <p className="eyebrow ok">
              <Icon name="check" size={16} /> Booking confirmed · {booking.id}
            </p>
            <h1>Your stay is confirmed, {firstName}.</h1>
            <p className="lead">
              We look forward to welcoming you on {formatLongDate(booking.checkIn).replace(/ \d{4}$/, "")}. Your{" "}
              {room.name.replace(/^The /, "").toLowerCase().includes("suite") ? "suite" : "room"} will be ready from
              15:00.
            </p>
            <form action={startOver} className="small muted">
              Arriving today? <Link href="/reception">Check in at reception</Link> ·{" "}
              <button type="submit" className="text-link">
                Make another booking
              </button>
            </form>
          </div>
          <StaySummary booking={booking} compact />
        </section>

        <IssuePanel
          card={{
            name: displayName(`${booking.guest.givenName} ${booking.guest.familyName}`),
            firstName,
            checkIn: formatDate(booking.checkIn),
            checkOut: formatDate(booking.checkOut),
            room: room.name.replace(/^The /, ""),
            bookingId: booking.id,
          }}
        />

        {/* eslint-disable-next-line @next/next/no-img-element -- static photo */}
        <img className="detail" src="/photos/detail-breakfast.jpg" alt="A breakfast tray by the window" />
      </main>
      <SiteFooter />
    </>
  );
}
