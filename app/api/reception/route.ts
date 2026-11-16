import { createHash } from "node:crypto";
import { createPresentation, failureMessage, getSession, ids } from "@/lib/eudiplo";
import { formatDate, hotelToday, nights } from "@/lib/hotel";
import { qrDataUrl } from "@/lib/qr";
import { bookings, receptionChecks } from "@/lib/store";

/** Reception asks the arriving guest's wallet for their booking. */
export async function POST() {
  try {
    const request = await createPresentation(ids.bookingPresentation(), `reception-${Date.now()}`);
    const session = await getSession(request.session).catch(() => undefined);
    const expiresAt = session?.expiresAt ? Date.parse(session.expiresAt) : Date.now() + 300_000;
    const check = receptionChecks.create({ sessionId: request.session, expiresAt });
    return Response.json({
      check,
      qr: await qrDataUrl(request.crossDeviceUri),
      uri: request.uri,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Check-in is unavailable right now." }, { status: 502 });
  }
}

/** Verifies the presented booking against the hotel's rules. */
export async function GET(request: Request) {
  const checkId = new URL(request.url).searchParams.get("check") ?? "";
  const check = receptionChecks.get(checkId);
  if (!check) return Response.json({ state: "failed", message: "Please start again." });

  try {
    const session = await getSession(check.sessionId);
    if (session.status === "failed") {
      receptionChecks.delete(checkId);
      return Response.json({ state: "failed", message: failureMessage(session) });
    }
    if (session.status === "expired" || (session.status !== "completed" && Date.now() > check.expiresAt + 5_000)) {
      receptionChecks.delete(checkId);
      return Response.json({ state: "expired", message: "The request expired. Please try again." });
    }
    if (session.status !== "completed") return Response.json({ state: "pending" });
    receptionChecks.delete(checkId);

    // EUDIPLO has verified that The Pearls signed this booking. Now the hotel's own rules.
    const b = session.credentials?.[0]?.values?.[0] ?? {};
    const bookingId = String(b.booking_id ?? "");
    const checkIn = String(b.check_in ?? "");
    const checkOut = String(b.check_out ?? "");
    const today = hotelToday();

    if (today < checkIn) {
      return Response.json({ state: "failed", message: `Your booking ${bookingId} starts on ${formatDate(checkIn)}.` });
    }
    if (today >= checkOut) {
      return Response.json({ state: "failed", message: `Your booking ${bookingId} ended on ${formatDate(checkOut)}.` });
    }
    // The signed booking must also match our own records, when we still have them.
    const record = bookings.get(bookingId);
    if (record && (record.checkIn !== checkIn || record.checkOut !== checkOut)) {
      return Response.json({ state: "failed", message: "This booking does not match our records. Please see the front desk." });
    }

    const name = String(b.given_name ?? "");
    const left = nights(today, checkOut);
    return Response.json({
      state: "done",
      result: {
        title: `Welcome to The Pearls, ${name.charAt(0)}${name.slice(1).toLowerCase()}!`,
        lines: [
          `Booking ${bookingId}: ${String(b.room_type ?? "")}, ${String(b.guests ?? "")} guest(s)`,
          `Your room: ${roomNumber(bookingId, String(b.room_type ?? ""))}`,
          `Check-out: ${formatDate(checkOut)}, 11:00 (${left} night${left === 1 ? "" : "s"})`,
          "Breakfast 7:00–10:30 on the harbour terrace",
        ],
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ state: "pending" });
  }
}

/** A stable room number per booking: Standard 2xx, Deluxe 3xx, Pearl Suite 5xx. */
function roomNumber(bookingId: string, roomType: string) {
  const floor = roomType.startsWith("Pearl") ? 5 : roomType === "Deluxe" ? 3 : 2;
  const n = createHash("sha256").update(bookingId).digest()[0] % 20;
  return `${floor}${String(n + 1).padStart(2, "0")}`;
}
