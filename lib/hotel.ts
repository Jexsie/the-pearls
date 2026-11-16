export const hotel = {
  name: "The Pearls",
  tagline: "A calm harbour hotel in Hamburg",
  address: "Am Kaiserkai 12, 20457 Hamburg",
  timeZone: process.env.HOTEL_TIMEZONE ?? "Europe/Berlin",
};

export const rooms = {
  standard: { name: "Standard", description: "Queen bed, city view", pricePerNight: 89, maxGuests: 2 },
  deluxe: { name: "Deluxe", description: "King bed, harbour view", pricePerNight: 129, maxGuests: 2 },
  suite: { name: "Pearl Suite", description: "Living room, balcony over the water", pricePerNight: 219, maxGuests: 4 },
} as const;

export type RoomId = keyof typeof rooms;

export function isRoomId(value: unknown): value is RoomId {
  return typeof value === "string" && value in rooms;
}

/** Today's date (YYYY-MM-DD) in the hotel's time zone. */
export function hotelToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: hotel.timeZone }).format(now);
}

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function nights(checkIn: string, checkOut: string) {
  return Math.round((Date.parse(`${checkOut}T12:00:00Z`) - Date.parse(`${checkIn}T12:00:00Z`)) / 86_400_000);
}

/** Age in whole years on a given date, both YYYY-MM-DD. */
export function ageOn(birthdate: string, date: string) {
  const [by, bm, bd] = birthdate.split("-").map(Number);
  const [y, m, d] = date.split("-").map(Number);
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
}

export function formatDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
