import Link from "next/link";
import { addDays, hotel, hotelToday, rooms } from "@/lib/hotel";
import { startBooking } from "./actions";

const errors: Record<string, string> = {
  room: "Please choose a room.",
  dates: "Please choose an arrival date from today on.",
  nights: "Stays are between 1 and 14 nights.",
  guests: "Too many guests for this room.",
};

export default async function Home({ searchParams }: PageProps<"/">) {
  const { error } = await searchParams;
  const today = hotelToday();

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">{hotel.address}</p>
        <h1>{hotel.name}</h1>
        <p className="tagline">{hotel.tagline}</p>
      </section>

      <section className="rooms">
        {Object.entries(rooms).map(([id, room]) => (
          <article key={id} className="room">
            <h2>{room.name}</h2>
            <p className="muted">{room.description}</p>
            <p>
              <strong>€{room.pricePerNight}</strong> / night · up to {room.maxGuests} guests
            </p>
          </article>
        ))}
      </section>

      <section className="card">
        <h2>Book your stay</h2>
        <p className="muted">
          No forms to fill in: you register with your EUDI wallet, and your booking goes straight into it.
        </p>
        {typeof error === "string" && errors[error] && (
          <p className="bad" role="alert">
            {errors[error]}
          </p>
        )}
        <form action={startBooking} className="form">
          <label>
            Room
            <select name="roomType" defaultValue="deluxe">
              {Object.entries(rooms).map(([id, room]) => (
                <option key={id} value={id}>
                  {room.name} · €{room.pricePerNight}/night
                </option>
              ))}
            </select>
          </label>
          <label>
            Arrival
            <input type="date" name="checkIn" defaultValue={today} min={today} required />
          </label>
          <label>
            Departure
            <input type="date" name="checkOut" defaultValue={addDays(today, 2)} min={addDays(today, 1)} required />
          </label>
          <label>
            Guests
            <select name="guests" defaultValue="2">
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="cta">
            Continue
          </button>
        </form>
      </section>

      <p className="muted center">
        Already booked and standing in the lobby? <Link href="/reception">Reception check-in</Link>
      </p>
    </main>
  );
}
