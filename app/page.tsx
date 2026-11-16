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

      <section className="card booking">
        <header className="booking-head">
          <h2>Book your stay</h2>
          <p className="muted">
            No forms to fill in: you register with your EUDI wallet, and your
            booking goes straight into it.
          </p>
        </header>
        {typeof error === "string" && errors[error] && (
          <p className="alert" role="alert">
            {errors[error]}
          </p>
        )}
        <form action={startBooking} className="booking-form">
          <fieldset>
            <legend>1. Choose your room</legend>
            <div className="room-options">
              {Object.entries(rooms).map(([id, room]) => (
                <label key={id} className="room-option">
                  <input
                    type="radio"
                    name="roomType"
                    value={id}
                    defaultChecked={id === "deluxe"}
                    required
                  />
                  <span className="room-name">{room.name}</span>
                  <span className="room-desc">{room.description}</span>
                  <span className="room-meta">
                    <span className="room-price">€{room.pricePerNight}</span> /
                    night · up to {room.maxGuests} guests
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>2. Your stay</legend>
            <div className="stay-fields">
              <label className="field">
                <span>Arrival</span>
                <input
                  type="date"
                  name="checkIn"
                  defaultValue={today}
                  min={today}
                  required
                />
              </label>
              <label className="field">
                <span>Departure</span>
                <input
                  type="date"
                  name="checkOut"
                  defaultValue={addDays(today, 2)}
                  min={addDays(today, 1)}
                  required
                />
              </label>
              <label className="field">
                <span>Guests</span>
                <select name="guests" defaultValue="2">
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "guest" : "guests"}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>

          <div className="booking-footer">
            <p className="muted">
              Next: register with your EUDI wallet. Payment at the hotel.
            </p>
            <button type="submit" className="cta">
              Continue
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
