export const hotel = {
  name: "The Pearls",
  tagline: "A house of thirty-two rooms on Lake Como",
  place: "Lake Como · Tremezzina",
  address: "Via Regina 18, 22016 Tremezzina (CO), Italia",
  phone: "+39 0344 401 218",
  timeZone: process.env.HOTEL_TIMEZONE ?? "Europe/Rome",
};

export const rooms = {
  linen: { photo: "/photos/room-linen.jpg", name: "The Linen Room", size: 32, features: ["Garden view", "Rain shower"], pricePerNight: 480, maxGuests: 2, floor: 2 },
  riva: { photo: "/photos/room-riva.jpg", name: "Riva Junior Suite", size: 48, features: ["Lake view", "Reading nook"], pricePerNight: 720, maxGuests: 2, floor: 3 },
  terrazza: { photo: "/photos/room-terrazza.jpg", name: "Terrazza Suite", size: 64, features: ["Private terrace", "Fireplace"], pricePerNight: 1150, maxGuests: 3, floor: 4 },
  residence: { photo: "/photos/room-residence.jpg", name: "The Pearl Residence", size: 140, features: ["Panoramic lake", "Butler service"], pricePerNight: 2600, maxGuests: 4, floor: 5 },
} as const;

/** "€1,150" */
export function formatEuro(amount: number) {
  return `€${amount.toLocaleString("en-GB")}`;
}

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

function dateParts(date: string, options: Intl.DateTimeFormatOptions) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { ...options, timeZone: "UTC" }).replace(",", "");
}

/** "Fri 14 May" */
export const formatDay = (date: string) => dateParts(date, { weekday: "short", day: "numeric", month: "short" });

/** "Friday, 14 May 2027" */
export const formatLongDate = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

/** "2 March 1988" */
export const formatBirthdate = (date: string) => dateParts(date, { day: "numeric", month: "long", year: "numeric" });

/** "14 – 17 May", "28 May – 2 Jun", "30 Dec 2027 – 2 Jan 2028" */
export function formatRange(checkIn: string, checkOut: string) {
  const [y1, m1] = checkIn.split("-");
  const [y2, m2] = checkOut.split("-");
  const end = dateParts(checkOut, { day: "numeric", month: "short", ...(y1 !== y2 && { year: "numeric" }) });
  const start =
    y1 !== y2
      ? dateParts(checkIn, { day: "numeric", month: "short", year: "numeric" })
      : m1 !== m2
        ? dateParts(checkIn, { day: "numeric", month: "short" })
        : String(Number(checkIn.slice(8)));
  return `${start} – ${end}`;
}

/** City tax of Tremezzina, per guest and night. */
export const CITY_TAX = 3.5;

export function price(roomType: RoomId, checkIn: string, checkOut: string, guests: number) {
  const stay = nights(checkIn, checkOut);
  const room = stay * rooms[roomType].pricePerNight;
  const cityTax = stay * guests * CITY_TAX;
  return { stay, room, cityTax, total: room + cityTax };
}

/** "€2,181.00" */
export function formatEuroCents(amount: number) {
  return `€${amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function roomIdByName(name: string) {
  return (Object.keys(rooms) as RoomId[]).find((id) => rooms[id].name === name);
}

/** "48 m² · Lake view · Reading nook" */
export const roomMeta = (id: RoomId) => [`${rooms[id].size} m²`, ...rooms[id].features].join(" · ");

/** PID names are often upper case: "ERIKA" -> "Erika". */
export function displayName(name: string) {
  return name.toLowerCase().replace(/(^|[\s-])\p{L}/gu, (c) => c.toUpperCase());
}

/** "DE" -> "Germany" */
export function countryName(code: string) {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

export const adults = (n: number) => `${n} ${n === 1 ? "adult" : "adults"}`;
