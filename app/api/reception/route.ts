import { createHash } from "node:crypto";
import { createPresentation, failureMessage, getSession, ids } from "@/lib/eudiplo";
import {
  adults,
  displayName,
  formatLongDate,
  formatRange,
  hotelToday,
  nights,
  roomIdByName,
  rooms,
} from "@/lib/hotel";
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
    if (session.status !== "completed") return Response.json({ state: "pending", scanned: session.status === "fetched" });
    receptionChecks.delete(checkId);

    // EUDIPLO has verified that The Pearls signed this booking. Now the hotel's own rules.
    const b = session.credentials?.[0]?.values?.[0] ?? {};
    const bookingId = String(b.booking_id ?? "");
    const checkIn = String(b.check_in ?? "");
    const checkOut = String(b.check_out ?? "");
    const today = hotelToday();

    // "notToday": the tablet shows "This booking isn't valid for today."
    if (today < checkIn) {
      return Response.json({
        state: "failed",
        reason: "notToday",
        message: `Booking ${bookingId} begins on ${formatLongDate(checkIn)}. Please speak to a member of our team — we’ll gladly help.`,
      });
    }
    if (today >= checkOut) {
      return Response.json({
        state: "failed",
        reason: "notToday",
        message: `Booking ${bookingId} ended on ${formatLongDate(checkOut)}. Please speak to a member of our team — we’ll gladly help.`,
      });
    }
    // The signed booking must also match our own records, when we still have them.
    const record = bookings.get(bookingId);
    if (record && (record.checkIn !== checkIn || record.checkOut !== checkOut)) {
      return Response.json({ state: "failed", message: "This booking does not match our records. Please see the front desk." });
    }

    const roomType = String(b.room_type ?? "");
    const stay = nights(checkIn, checkOut);
    return Response.json({
      state: "done",
      result: {
        name: displayName(String(b.given_name ?? "")),
        bookingId,
        roomType,
        roomId: roomIdByName(roomType) ?? null,
        roomNumber: roomNumber(bookingId, roomType),
        stay: `${formatRange(checkIn, checkOut)} · ${stay} night${stay === 1 ? "" : "s"}`,
        guests: adults(Number(b.guests ?? 1)),
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ state: "pending" });
  }
}

/** A stable room number per booking, on the floor of its room type (lib/hotel.ts). */
function roomNumber(bookingId: string, roomType: string) {
  const floor = Object.values(rooms).find((room) => room.name === roomType)?.floor ?? 2;
  const n = createHash("sha256").update(bookingId).digest()[0] % 20;
  return `${floor}${String(n + 1).padStart(2, "0")}`;
}
