import { cookies } from "next/headers";
import { createOffer, getSession, ids } from "@/lib/eudiplo";
import { hotel, rooms } from "@/lib/hotel";
import { qrDataUrl } from "@/lib/qr";
import { BOOKING_COOKIE, bookings } from "@/lib/store";

const OFFER_LIFETIME_SECONDS = 600;

async function currentConfirmed() {
  const booking = bookings.get((await cookies()).get(BOOKING_COOKIE)?.value);
  return booking?.status === "confirmed" && booking.guest ? booking : undefined;
}

/** Issues the booking credential to the guest's wallet. */
export async function POST() {
  const booking = await currentConfirmed();
  if (!booking?.guest) return Response.json({ error: "No confirmed booking found." }, { status: 404 });

  try {
    const offer = await createOffer(
      ids.bookingCredential(),
      {
        booking_id: booking.id,
        hotel: hotel.name,
        given_name: booking.guest.givenName,
        family_name: booking.guest.familyName,
        room_type: rooms[booking.roomType].name,
        check_in: booking.checkIn,
        check_out: booking.checkOut,
        guests: booking.guests,
      },
      OFFER_LIFETIME_SECONDS,
    );
    const expiresAt = Date.now() + OFFER_LIFETIME_SECONDS * 1000;
    booking.walletOffer = { sessionId: offer.session, expiresAt };
    bookings.save(booking);
    return Response.json({
      qr: await qrDataUrl(offer.uri),
      uri: offer.uri,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Adding the booking to your wallet is unavailable right now." }, { status: 502 });
  }
}

/** Reports whether the wallet has picked up the booking credential. */
export async function GET() {
  const booking = await currentConfirmed();
  if (!booking?.walletOffer) return Response.json({ state: "failed", message: "Please try again." });

  try {
    const session = await getSession(booking.walletOffer.sessionId);
    if (session.status === "fetched" || session.status === "completed") {
      return Response.json({ state: "done", message: "Your booking is in your wallet." });
    }
    if (session.status === "failed") return Response.json({ state: "failed", message: "Your wallet reported an error." });
    if (session.status === "expired" || Date.now() > booking.walletOffer.expiresAt + 5_000) {
      return Response.json({ state: "expired", message: "The code expired. Please try again." });
    }
    return Response.json({ state: "pending" });
  } catch (error) {
    console.error(error);
    return Response.json({ state: "pending" });
  }
}
