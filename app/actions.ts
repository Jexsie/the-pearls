"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { addDays, hotelToday, isRoomId, nights, price, rooms } from "@/lib/hotel";
import { BOOKING_COOKIE, bookings, newBookingId } from "@/lib/store";

const secure = (process.env.APP_URL ?? "").startsWith("https://");
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Step 1: the guest picks room and dates. Creates a draft booking. */
export async function startBooking(formData: FormData) {
  const roomType = formData.get("roomType");
  const checkIn = String(formData.get("checkIn") ?? "");
  const checkOut = String(formData.get("checkOut") ?? "");
  const guests = Number(formData.get("guests"));
  const today = hotelToday();

  if (!isRoomId(roomType)) redirect("/?error=room");
  if (!DATE.test(checkIn) || !DATE.test(checkOut) || checkIn < today || checkIn > addDays(today, 365)) {
    redirect("/?error=dates");
  }
  const stay = nights(checkIn, checkOut);
  if (stay < 1 || stay > 14) redirect("/?error=nights");
  if (!Number.isInteger(guests) || guests < 1 || guests > rooms[roomType].maxGuests) redirect("/?error=guests");

  const id = newBookingId();
  bookings.save({
    id,
    status: "draft",
    roomType,
    checkIn,
    checkOut,
    guests,
    total: price(roomType, checkIn, checkOut, guests).total,
  });
  (await cookies()).set(BOOKING_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 7 * 24 * 3600,
  });
  redirect("/book");
}

async function currentDraft() {
  const booking = bookings.get((await cookies()).get(BOOKING_COOKIE)?.value);
  return booking?.status === "draft" ? booking : undefined;
}

/** Step 2b: the guest has checked the details from their wallet and confirms. */
export async function confirmBooking() {
  const booking = await currentDraft();
  if (!booking) redirect("/");
  if (!booking.guest) redirect("/book");
  booking.status = "confirmed";
  bookings.save(booking);
  redirect("/booking");
}

/** Drops the details from the wallet, so the guest can scan again. */
export async function scanAgain() {
  const booking = await currentDraft();
  if (!booking) redirect("/");
  booking.guest = undefined;
  booking.registeredAt = undefined;
  bookings.save(booking);
  redirect("/book");
}

/** Forgets this browser's booking and starts over. */
export async function startOver() {
  (await cookies()).delete(BOOKING_COOKIE);
  redirect("/");
}
