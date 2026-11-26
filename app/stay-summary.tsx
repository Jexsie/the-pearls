import {
  adults,
  addDays,
  formatDay,
  formatEuroCents,
  formatRange,
  hotelToday,
  price,
  roomMeta,
  rooms,
} from "@/lib/hotel";
import type { Booking } from "@/lib/store";

/** "Stay summary" of the booking steps: full on Registration, compact on Confirmation. */
export default function StaySummary({ booking, compact = false }: { booking: Booking; compact?: boolean }) {
  const room = rooms[booking.roomType];
  const p = price(booking.roomType, booking.checkIn, booking.checkOut, booking.guests);

  if (compact) {
    return (
      <aside className="stay-summary compact" aria-label="Your stay">
        {/* eslint-disable-next-line @next/next/no-img-element -- static photo */}
        <img src={room.photo} alt="" />
        <div className="stay-details">
          <h2>{room.name}</h2>
          <dl>
            <dt>Dates</dt>
            <dd>
              {formatRange(booking.checkIn, booking.checkOut)}
              {/* formatRange already names both years when the stay crosses New Year. */}
              {booking.checkIn.slice(0, 4) === booking.checkOut.slice(0, 4) && ` ${booking.checkOut.slice(0, 4)}`}
            </dd>
            <dt>Guests</dt>
            <dd>
              {adults(booking.guests)} · {p.stay} {p.stay === 1 ? "night" : "nights"}
            </dd>
            <dt>Total</dt>
            <dd>{formatEuroCents(booking.total)} incl. city tax</dd>
          </dl>
        </div>
      </aside>
    );
  }

  return (
    <aside className="stay-summary" aria-label="Your stay">
      {/* eslint-disable-next-line @next/next/no-img-element -- static photo */}
      <img src={room.photo} alt="" />
      <div className="stay-details">
        <p className="eyebrow">Your stay</p>
        <h2>{room.name}</h2>
        <p className="muted">{roomMeta(booking.roomType)}</p>
        <div className="stay-dates">
          <div>
            <p className="eyebrow">Arrival</p>
            <p className="day">{formatDay(booking.checkIn)}</p>
            <p className="muted">from 15:00</p>
          </div>
          <div>
            <p className="eyebrow">Departure</p>
            <p className="day">{formatDay(booking.checkOut)}</p>
            <p className="muted">until 11:00</p>
          </div>
        </div>
        <dl className="price-lines">
          <div>
            <dt>
              {p.stay} {p.stay === 1 ? "night" : "nights"} × {formatEuroCents(room.pricePerNight).replace(".00", "")}
            </dt>
            <dd>{formatEuroCents(p.room)}</dd>
          </div>
          <div>
            <dt>
              City tax · {booking.guests} {booking.guests === 1 ? "guest" : "guests"} × {p.stay}{" "}
              {p.stay === 1 ? "night" : "nights"}
            </dt>
            <dd>{formatEuroCents(p.cityTax)}</dd>
          </div>
        </dl>
        <div className="stay-total">
          <p className="eyebrow">Total · {adults(booking.guests)}</p>
          <p className="amount">{formatEuroCents(booking.total)}</p>
        </div>
        <p className="muted small">
          {/* Free cancellation up to a week before arrival; no promise when that date has passed. */}
          {addDays(booking.checkIn, -7) >= hotelToday() &&
            `Free cancellation until ${formatDay(addDays(booking.checkIn, -7))}. `}
          Pay at the hotel.
        </p>
      </div>
    </aside>
  );
}
