"use client";

import { useEffect, useState } from "react";
import { Logo } from "../chrome";
import { Icon } from "../icons";
import { useWalletFlow } from "../wallet-flow";

type Valid = {
  name: string;
  bookingId: string;
  roomType: string;
  roomNumber: string;
  roomPhoto: string | null;
  stay: string;
  guests: string;
};

/** Live date and time in the hotel's time zone; rendered after mount to avoid a hydration mismatch. */
function useClock(timeZone: string) {
  const [now, setNow] = useState<Date>();
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = setInterval(tick, 15_000);
    return () => clearInterval(timer);
  }, []);
  if (!now) return { day: "", time: "" };
  return {
    day: now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone }),
    time: now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone }),
  };
}

const RESET_AFTER_MS = 60_000;

/** The lobby tablet: arriving guests check in with the booking credential in their wallet. */
export default function Kiosk({ timeZone, roomPhotos }: { timeZone: string; roomPhotos: Record<string, string> }) {
  const flow = useWalletFlow<Omit<Valid, "roomPhoto"> & { roomId: string | null }>("/api/reception");
  const clock = useClock(timeZone);
  const { phase, started, start } = flow;

  // An expired code just makes way for a new one; a welcome screen returns to the start after a minute.
  useEffect(() => {
    if (phase === "failed" && flow.reason === "expired") void start();
    if (phase !== "done") return;
    const timer = setTimeout(start, RESET_AFTER_MS);
    return () => clearTimeout(timer);
  }, [phase, flow.reason, start]);

  if (phase === "done" && flow.result) {
    const r = flow.result;
    const photo = r.roomId ? roomPhotos[r.roomId] : undefined;
    return (
      <main className="kiosk valid" aria-live="polite">
        <div className="kiosk-room">
          {/* eslint-disable-next-line @next/next/no-img-element -- static photo */}
          {photo && <img src={photo} alt="" />}
          <p className="eyebrow">Your room</p>
        </div>
        <section className="kiosk-valid">
          <span className="pearl-check">
            <Icon name="check" size={34} />
          </span>
          <p className="eyebrow ok">Booking valid</p>
          <h1>Welcome, {r.name}.</h1>
          <dl className="kiosk-stay">
            <div>
              <dt>Room</dt>
              <dd>
                {r.roomType} · {r.roomNumber}
              </dd>
            </div>
            <div>
              <dt>Stay</dt>
              <dd>{r.stay}</dd>
            </div>
            <div>
              <dt>Guests</dt>
              <dd>{r.guests}</dd>
            </div>
          </dl>
          <p className="key-note">
            <Icon name="key" size={24} /> Your key is ready. Our concierge will take you up.
          </p>
          <p className="verified-by">
            <Icon name="seal" size={16} /> Checked with EUDI Wallet · {clock.time} · no ID copy taken
          </p>
          <button type="button" className="cta ghost" onClick={start}>
            Next guest
          </button>
        </section>
      </main>
    );
  }

  if (phase === "failed" && flow.reason !== "expired") {
    const notToday = flow.reason === "notToday";
    return (
      <main className="kiosk problem" role="alert">
        <Logo />
        <span className="problem-icon">
          <Icon name={notToday ? "calendar" : "close"} size={30} />
        </span>
        <h1>{notToday ? "This booking isn’t valid for today." : "We couldn’t check this booking."}</h1>
        <p className="lead">{flow.message ?? "Please speak to a member of our team — we’ll gladly help."}</p>
        <button type="button" className="cta ghost" onClick={start}>
          Scan another booking
        </button>
        <p className="muted">
          Today · {clock.day} · {clock.time}
        </p>
      </main>
    );
  }

  return (
    <main className="kiosk">
      <section className="kiosk-welcome">
        <Logo />
        <div className="kiosk-message">
          <p className="eyebrow">Reception</p>
          <h1>Welcome to The Pearls</h1>
          <p className="lead">Please present your booking.</p>
          <p className="muted">Open your EU Digital Identity Wallet and scan the code. It only takes a moment.</p>
        </div>
        <p className="kiosk-clock">
          <span>{clock.day}</span>
          <span>{clock.time}</span>
        </p>
      </section>
      <section className="kiosk-scan" aria-live="polite">
        <div className={`qr-tile${phase === "scanned" ? " is-waiting" : ""}`}>
          {started && phase !== "starting" ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the server */}
              <img className="qr" src={started.qr} alt="QR code to scan with your EUDI wallet" />
              {phase === "scanned" ? (
                <span className="qr-spinner" aria-hidden="true">
                  <Icon name="phone" size={30} />
                </span>
              ) : (
                <span className="qr-mark" aria-hidden="true" />
              )}
            </>
          ) : (
            <span className="qr-loading" aria-hidden="true" />
          )}
        </div>
        <p className="eyebrow">{phase === "scanned" ? "Approve on your phone" : "Scan with your wallet"}</p>
        <p className="muted">Your booking stays on your phone — we only check it.</p>
      </section>
    </main>
  );
}
