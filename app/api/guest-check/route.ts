import { cookies } from "next/headers";
import { createPresentation, failureMessage, getSession, ids } from "@/lib/eudiplo";
import { ageOn, formatDate } from "@/lib/hotel";
import { qrDataUrl } from "@/lib/qr";
import { BOOKING_COOKIE, bookings, type Guest } from "@/lib/store";

const MIN_AGE = 18;

async function currentDraft() {
  const booking = bookings.get((await cookies()).get(BOOKING_COOKIE)?.value);
  return booking?.status === "draft" ? booking : undefined;
}

/** Asks the guest's wallet for the registration data from the PID. */
export async function POST() {
  const booking = await currentDraft();
  if (!booking) return Response.json({ error: "Your booking session has ended. Please start again." }, { status: 404 });

  try {
    const request = await createPresentation(ids.guestPresentation(), booking.id);
    const session = await getSession(request.session).catch(() => undefined);
    const expiresAt = session?.expiresAt ? Date.parse(session.expiresAt) : Date.now() + 300_000;
    booking.guestCheck = { sessionId: request.session, expiresAt };
    bookings.save(booking);
    return Response.json({
      qr: await qrDataUrl(request.crossDeviceUri),
      uri: request.uri,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Registration with the wallet is unavailable right now." }, { status: 502 });
  }
}

/** Reports the check and, once the PID is verified, applies the hotel's rules. */
export async function GET() {
  const booking = await currentDraft();
  if (!booking?.guestCheck) return Response.json({ state: "failed", message: "Please start again." });

  try {
    const session = await getSession(booking.guestCheck.sessionId);
    if (session.status === "failed") return Response.json({ state: "failed", message: failureMessage(session) });
    if (session.status === "expired" || (session.status !== "completed" && Date.now() > booking.guestCheck.expiresAt + 5_000)) {
      return Response.json({ state: "expired", message: "The request expired. Please try again." });
    }
    // "fetched": the wallet has scanned the code and shows the request to the guest.
    if (session.status !== "completed") return Response.json({ state: "pending", scanned: session.status === "fetched" });

    const pid = session.credentials?.[0]?.values?.[0] ?? {};
    const guest: Guest = {
      givenName: String(pid.given_name ?? ""),
      familyName: String(pid.family_name ?? ""),
      birthdate: String(pid.birthdate ?? ""),
      nationality: Array.isArray(pid.nationalities) ? String(pid.nationalities[0] ?? "") : "",
      address: (pid.address ?? {}) as Guest["address"],
    };

    // Hotel rule: the guest who books must be an adult on the day of arrival.
    if (!guest.birthdate || ageOn(guest.birthdate, booking.checkIn) < MIN_AGE) {
      return Response.json({
        state: "failed",
        message: `Bookings need a guest aged ${MIN_AGE} or over on arrival (${formatDate(booking.checkIn)}).`,
      });
    }

    // Registered, not yet confirmed: the guest checks the details, then confirms (confirmBooking).
    booking.guest = guest;
    booking.registeredAt = Date.now();
    booking.guestCheck = undefined;
    bookings.save(booking);
    return Response.json({ state: "done" });
  } catch (error) {
    console.error(error);
    return Response.json({ state: "pending" });
  }
}
