import { addDays, formatEuro, hotel, hotelToday, rooms } from "@/lib/hotel";
import { SiteFooter, SiteHeader } from "./chrome";
import { Icon } from "./icons";
import { startBooking } from "./actions";

const errors: Record<string, string> = {
  room: "Please choose a room.",
  dates: "Please choose an arrival date from today on.",
  nights: "Stays are between 1 and 14 nights.",
  guests: "Too many guests for this room.",
};

const entries = Object.entries(rooms) as [keyof typeof rooms, (typeof rooms)[keyof typeof rooms]][];

export default async function Home({ searchParams }: PageProps<"/">) {
  const { error } = await searchParams;
  const today = hotelToday();

  return (
    <>
      <SiteHeader />
      <main className="home">
        {/* One form: the stay fields in the hero and a submit button per room card. */}
        <form action={startBooking} id="stay" />

        <section className="hero" aria-labelledby="hero-title">
          {/* eslint-disable-next-line @next/next/no-img-element -- static photo */}
          <img src="/photos/hero-terrace.jpg" alt="A stone terrace over the lake at golden hour" />
          <div className="hero-inner">
            <div className="hero-text">
              <p className="eyebrow">{hotel.place}</p>
              <h1 id="hero-title">{hotel.name}</h1>
              <p className="tagline">{hotel.tagline}</p>
            </div>

            <div className="stay-bar" role="group" aria-label="Your stay">
              <label className="field">
                <span>
                  <Icon name="calendar" size={14} /> Arrival
                </span>
                <input form="stay" type="date" name="checkIn" defaultValue={today} min={today} required />
              </label>
              <label className="field">
                <span>
                  <Icon name="calendar" size={14} /> Departure
                </span>
                <input
                  form="stay"
                  type="date"
                  name="checkOut"
                  defaultValue={addDays(today, 2)}
                  min={addDays(today, 1)}
                  required
                />
              </label>
              <label className="field">
                <span>
                  <Icon name="guests" size={14} /> Guests
                </span>
                <select form="stay" name="guests" defaultValue="2">
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "adult" : "adults"}
                    </option>
                  ))}
                </select>
              </label>
              <a href="#rooms" className="cta">
                Choose a room <Icon name="arrow" size={18} />
              </a>
            </div>
            {typeof error === "string" && errors[error] && (
              <p className="alert" role="alert">
                {errors[error]}
              </p>
            )}
          </div>
        </section>

        <section className="intro" aria-labelledby="intro-label">
          <span className="pearl-dot" aria-hidden="true" />
          <p className="intro-text">
            Thirty-two rooms on the western shore of Lake Como. Linen, light and long mornings — and an arrival with no
            queue and no paperwork.
          </p>
          <p className="eyebrow" id="intro-label">
            Welcome to {hotel.name}
          </p>
        </section>

        <section className="rooms" id="rooms" aria-labelledby="rooms-title">
          <header className="section-head">
            <div>
              <p className="eyebrow">Rooms &amp; Suites</p>
              <h2 id="rooms-title">Four ways to stay</h2>
            </div>
            <p className="section-note">Pick a room to continue. You register with your EUDI wallet next.</p>
          </header>

          <div className="room-grid">
            {entries.map(([id, room]) => (
              <article key={id} className="room-card">
                {/* eslint-disable-next-line @next/next/no-img-element -- static photo */}
                <img src={room.photo} alt="" />
                <div className="room-title">
                  <h3>
                    <button form="stay" type="submit" name="roomType" value={id}>
                      {room.name}
                    </button>
                  </h3>
                  <p className="room-price">
                    {formatEuro(room.pricePerNight)} <span>/ night</span>
                  </p>
                </div>
                <ul className="room-meta">
                  <li>{room.size} m²</li>
                  {room.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* eslint-disable-next-line @next/next/no-img-element -- static photo */}
        <img className="detail" src="/photos/detail-bathtub.jpg" alt="A stone bathtub by a window over the lake" />
      </main>
      <SiteFooter />
    </>
  );
}
