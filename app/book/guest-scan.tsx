"use client";

import { useRouter } from "next/navigation";
import { Icon } from "../icons";
import { useCountdown, useWalletFlow } from "../wallet-flow";

/**
 * "Wallet panel / scan" and "/ waiting": asks the guest's wallet for the
 * registration data. Once it arrives the server page shows "/ received".
 */
export default function GuestScan() {
  const router = useRouter();
  const flow = useWalletFlow("/api/guest-check", () => router.refresh());
  const countdown = useCountdown(flow.started?.expiresAt);
  const { phase, started } = flow;
  const showQr = started && (phase === "ready" || phase === "scanned");

  return (
    <section className="wallet-panel" aria-live="polite" aria-labelledby="wallet-title">
      <div className="qr-area">
        <div className={`qr-tile${phase === "scanned" ? " is-waiting" : ""}`}>
          {showQr ? (
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
          ) : phase === "failed" ? (
            <Icon name="close" size={36} />
          ) : (
            <span className="qr-loading" aria-hidden="true" />
          )}
        </div>
        <p className="expiry">
          <Icon name="lock" size={14} />
          {phase === "scanned"
            ? "Request sent to your wallet"
            : phase === "failed"
              ? "No details received"
              : countdown
                ? `Single use · expires in ${countdown}`
                : "Preparing a single-use code…"}
        </p>
      </div>

      <div className="panel-copy">
        {phase === "scanned" ? (
          <>
            <p className="eyebrow">Waiting for your wallet…</p>
            <h2 id="wallet-title">Approve on your phone</h2>
            <p>
              Your wallet shows exactly what The Pearls is asking for — name, date of birth, nationality and address.
              Nothing else.
            </p>
            <p className="same-device">
              <Icon name="phone" size={18} /> Changed your mind?{" "}
              <button type="button" className="text-link" onClick={flow.start}>
                Cancel
              </button>
            </p>
          </>
        ) : phase === "failed" ? (
          <>
            <p className="eyebrow">Not registered</p>
            <h2 id="wallet-title">That didn’t work</h2>
            <p role="alert">{flow.message ?? "Something went wrong."}</p>
            <p className="same-device">
              <button type="button" className="cta" onClick={flow.start}>
                Try again <Icon name="arrow" size={18} />
              </button>
            </p>
          </>
        ) : (
          <>
            <p className="eyebrow">Recommended · about 20 seconds</p>
            <h2 id="wallet-title">Register with your EUDI Wallet</h2>
            <p>
              Scan the code with your EU Digital Identity Wallet and approve. Your details arrive verified — no typing,
              no passport copy at reception.
            </p>
            {started && (
              <p className="same-device">
                <Icon name="phone" size={18} /> Wallet on this device?{" "}
                <a className="text-link" href={started.uri}>
                  Open wallet
                </a>
              </p>
            )}
          </>
        )}
        <p className="privacy">
          <Icon name="shield" size={18} /> We receive only what your booking requires. Nothing more.
        </p>
      </div>
    </section>
  );
}
