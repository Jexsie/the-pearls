import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { countryName, displayName, formatBirthdate, formatLongDate, hotel } from "@/lib/hotel";
import { BOOKING_COOKIE, bookings, type Guest } from "@/lib/store";
import { confirmBooking, scanAgain, startOver } from "../actions";
import { CheckoutHeader } from "../chrome";
import { Icon } from "../icons";
import StaySummary from "../stay-summary";
import GuestScan from "./guest-scan";

function formatAddress({ street_address, postal_code, locality, country }: Guest["address"]) {
  return [street_address, [postal_code, locality].filter(Boolean).join(" "), country && countryName(country)]
    .filter(Boolean)
    .join(", ");
}

/** Step 2: the guest registers by sharing data from their PID, checks it, then confirms. */
export default async function Book() {
  const booking = bookings.get((await cookies()).get(BOOKING_COOKIE)?.value);
  if (!booking) redirect("/");
  if (booking.status === "confirmed") redirect("/booking");
  const { guest } = booking;

  const fields: { label: string; value?: string; wide?: boolean }[] = [
    { label: "Full name", value: guest && displayName(`${guest.givenName} ${guest.familyName}`), wide: true },
    { label: "Date of birth", value: guest && formatBirthdate(guest.birthdate) },
    { label: "Nationality", value: guest && countryName(guest.nationality) },
    { label: "Address", value: guest && formatAddress(guest.address), wide: true },
  ];

  return (
    <>
      <CheckoutHeader step={2} />
      <main className="checkout-main">
        <div className="registration">
          <header className="reg-title">
            <h1>Register your stay</h1>
            <p className="lead">
              Italian law asks every hotel to register its guests. With your wallet, it takes one scan.
            </p>
          </header>

          {guest ? (
            <section className="wallet-panel received" aria-labelledby="wallet-title">
              <div className="qr-area">
                <div className="qr-tile received-mark">
                  <span className="mark-circle">
                    <Icon name="check" size={36} />
                  </span>
                </div>
                <p className="expiry">
                  <Icon name="check" size={14} /> Received
                  {booking.registeredAt &&
                    ` · ${new Date(booking.registeredAt).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: hotel.timeZone,
                    })}`}
                </p>
              </div>
              <div className="panel-copy">
                <p className="eyebrow">Verified by your EUDI Wallet</p>
                <h2 id="wallet-title">Welcome, {displayName(guest.givenName)}. Your details have arrived.</h2>
                <p>
                  Everything below came straight from your wallet — verified, nothing typed. Please check, then confirm
                  your booking.
                </p>
                <p className="privacy">
                  <Icon name="shield" size={18} /> We receive only what your booking requires. Nothing more.
                </p>
              </div>
            </section>
          ) : (
            <GuestScan />
          )}

          <section className="guest-details" aria-labelledby="details-title">
            <div className="form-head">
              <h2 id="details-title">Guest details</h2>
              <p className="eyebrow">{guest ? "From EUDI Wallet · not editable" : "Filled from your wallet"}</p>
            </div>
            <dl className="gfields">
              {fields.map(({ label, value, wide }) => (
                <div key={label} className={wide ? "gfield wide" : "gfield"}>
                  <dt>
                    {label}
                    {value && (
                      <span className="badge">
                        <Icon name="seal" size={14} /> Verified
                      </span>
                    )}
                  </dt>
                  <dd className={value ? "verified" : "awaiting"}>
                    {value ? (
                      <>
                        <span>{value}</span>
                        <Icon name="lock" size={14} />
                      </>
                    ) : (
                      <>
                        <Icon name="wallet" size={18} />
                        <span>Awaiting your wallet</span>
                      </>
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="rule-note">
              <Icon name="info" size={18} />
              <span>All guests must be 18 or older on the day of arrival — {formatLongDate(booking.checkIn)}.</span>
              {guest && (
                <span className="met">
                  <Icon name="check" size={16} /> Requirement met
                </span>
              )}
            </p>

            <div className="form-actions">
              {guest ? (
                <form action={scanAgain}>
                  Something wrong? Update it in your wallet, then{" "}
                  <button type="submit" className="text-link">
                    scan again
                  </button>
                </form>
              ) : (
                <form action={startOver}>
                  Changed your plans?{" "}
                  <button type="submit" className="text-link">
                    Start over
                  </button>
                </form>
              )}
              <form action={confirmBooking}>
                <button type="submit" className="cta" disabled={!guest}>
                  Confirm booking <Icon name="arrow" size={18} />
                </button>
              </form>
            </div>
          </section>
        </div>

        <StaySummary booking={booking} />
      </main>
    </>
  );
}
