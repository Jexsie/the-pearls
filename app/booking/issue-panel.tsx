"use client";

import { Icon } from "../icons";
import { useCountdown, useWalletFlow } from "../wallet-flow";

type Card = { name: string; firstName: string; checkIn: string; checkOut: string; room: string; bookingId: string };

/** "Add to wallet (issuance)": the booking credential offer, with a picture of what the wallet receives. */
export default function IssuePanel({ card }: { card: Card }) {
  const flow = useWalletFlow("/api/booking-credential");
  const countdown = useCountdown(flow.started?.expiresAt);
  const { phase, started } = flow;
  const step = phase === "done" ? 3 : phase === "scanned" ? 2 : 1;

  return (
    <section className="issue-panel" aria-labelledby="issue-title">
      <div className="issue-copy">
        <p className="eyebrow">One last thing · 10 seconds</p>
        <h2 id="issue-title">Add your booking to your wallet</h2>
        <p>
          Scan with your EU Digital Identity Wallet and your booking arrives on your phone. Show it at reception — no
          paperwork.
        </p>
        <ol className="issue-steps">
          {["Scan", "Accept in your wallet", "Done"].map((label, i) => (
            <li
              key={label}
              aria-current={i + 1 === step ? "step" : undefined}
              className={i + 1 < step || phase === "done" ? "done" : undefined}
            >
              <span className="num">{i + 1 < step || phase === "done" ? <Icon name="check" size={14} /> : i + 1}</span>
              {label}
            </li>
          ))}
        </ol>
      </div>

      <div className="qr-area" aria-live="polite">
        <div className={`qr-tile${phase === "done" ? " received-mark" : ""}`}>
          {phase === "done" ? (
            <span className="mark-circle">
              <Icon name="check" size={36} />
            </span>
          ) : phase === "failed" ? (
            <Icon name="close" size={36} />
          ) : started ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the server */}
              <img className="qr" src={started.qr} alt="QR code to add the booking to your EUDI wallet" />
              <span className="qr-mark key" aria-hidden="true">
                <Icon name="key" size={22} />
              </span>
            </>
          ) : (
            <span className="qr-loading" aria-hidden="true" />
          )}
        </div>
        {phase === "done" ? (
          <>
            <p className="expiry">
              <Icon name="check" size={14} /> {flow.message ?? "Your booking is in your wallet."}
            </p>
            <button type="button" className="text-link" onClick={flow.start}>
              Add it again
            </button>
          </>
        ) : phase === "failed" ? (
          <>
            <p className="expiry" role="alert">
              {flow.message ?? "Something went wrong."}
            </p>
            <button type="button" className="text-link" onClick={flow.start}>
              Try again
            </button>
          </>
        ) : (
          <>
            <p className="expiry">
              <Icon name="lock" size={14} /> {countdown ? `Single use · expires in ${countdown}` : "Preparing…"}
            </p>
            {started && (
              <a className="text-link" href={started.uri}>
                Wallet on this phone? Open it
              </a>
            )}
          </>
        )}
      </div>

      <figure className="credential">
        <div className="credential-card" aria-hidden="true">
          <p className="card-type">Booking credential</p>
          <p className="card-name">{card.name}</p>
          <div className="card-stay">
            <div>
              <span>Check-in</span>
              {card.checkIn}
            </div>
            <div>
              <span>Check-out</span>
              {card.checkOut}
            </div>
            <div>
              <span>Room</span>
              {card.room}
            </div>
          </div>
          <div className="card-foot">
            <span>{card.bookingId}</span>
            <span>
              <Icon name="seal" size={14} /> EUDI Wallet
            </span>
          </div>
        </div>
        <figcaption className="eyebrow">This is what lands in {card.firstName}’s wallet</figcaption>
      </figure>
    </section>
  );
}
