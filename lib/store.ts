import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import type { RoomId } from "./hotel";

/**
 * The hotel's booking records and running checks. Kept in memory: fine for a
 * single-process demo, lost on restart.
 */

export type Guest = {
  givenName: string;
  familyName: string;
  birthdate: string;
  nationality: string;
  address: { street_address?: string; postal_code?: string; locality?: string; country?: string };
};

export type Booking = {
  id: string; // shown to the guest, e.g. TP-4K7Q2M
  status: "draft" | "confirmed";
  roomType: RoomId;
  checkIn: string;
  checkOut: string;
  guests: number;
  /** Room plus city tax, in euros. */
  total: number;
  /** Set when the guest's PID has been verified; confirmed afterwards by the guest. */
  guest?: Guest;
  registeredAt?: number;
  /** EUDIPLO session of the guest's PID check (server only). */
  guestCheck?: { sessionId: string; expiresAt: number };
  /** EUDIPLO session of the booking credential offer (server only). */
  walletOffer?: { sessionId: string; expiresAt: number };
};

export type ReceptionCheck = { sessionId: string; expiresAt: number };

type Store = { bookings: Map<string, Booking>; reception: Map<string, ReceptionCheck> };

const store: Store = ((globalThis as { __pearls?: Store }).__pearls ??= {
  bookings: new Map(),
  reception: new Map(),
});

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newBookingId() {
  let id = "TP-";
  for (let i = 0; i < 6; i++) id += ALPHABET[randomInt(ALPHABET.length)];
  return id;
}

export const bookings = {
  get: (id: string | undefined) => (id ? store.bookings.get(id) : undefined),
  save: (booking: Booking) => store.bookings.set(booking.id, booking),
};

export const receptionChecks = {
  create(check: ReceptionCheck) {
    const id = randomUUID();
    const cutoff = Date.now() - 60 * 60_000;
    for (const [key, value] of store.reception) if (value.expiresAt < cutoff) store.reception.delete(key);
    store.reception.set(id, check);
    return id;
  },
  get: (id: string) => store.reception.get(id),
  delete: (id: string) => store.reception.delete(id),
};

export const BOOKING_COOKIE = "tp_booking";
