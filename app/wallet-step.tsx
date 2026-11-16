"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * One wallet interaction: start it on the server, show the QR code, poll the
 * server until it reports a result. The server never sends EUDIPLO session
 * IDs, only an opaque `check` where needed.
 *
 * Contract of the endpoint:
 *   POST endpoint            -> { qr, uri, expiresAt, check? }
 *   GET  endpoint[?check=…]  -> { state: "pending" | "done" | "failed" | "expired", message?, result? }
 */

type Result = { title: string; lines: string[] };
type PollBody = { state: "pending" | "done" | "failed" | "expired"; message?: string; result?: Result };
type Started = { qr: string; uri: string; expiresAt: string; check?: string };

export default function WalletStep({
  endpoint,
  startLabel,
  intro,
  waiting,
  successHref,
  restartLabel = "Start again",
}: {
  endpoint: string;
  startLabel: string;
  intro: React.ReactNode;
  waiting: string;
  /** Navigate here on success; otherwise the result is shown in place. */
  successHref?: string;
  restartLabel?: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "starting" | "pending" | "done" | "failed">("idle");
  const [started, setStarted] = useState<Started>();
  const [message, setMessage] = useState<string>();
  const [result, setResult] = useState<Result>();

  useEffect(() => {
    if (phase !== "pending" || !started) return;
    let stopped = false;
    const url = started.check ? `${endpoint}?check=${encodeURIComponent(started.check)}` : endpoint;
    const poll = async () => {
      if (stopped) return;
      try {
        const res = await fetch(url, { cache: "no-store" });
        const body = (await res.json()) as PollBody;
        if (body.state === "done") {
          setResult(body.result);
          setMessage(body.message);
          setPhase("done");
          if (successHref) {
            router.push(successHref);
            router.refresh();
          }
          return;
        }
        if (body.state === "failed" || body.state === "expired") {
          setMessage(body.message);
          setPhase("failed");
          return;
        }
      } catch {
        // Try again on the next tick.
      }
      setTimeout(poll, 2000);
    };
    void poll();
    return () => {
      stopped = true;
    };
  }, [phase, started, endpoint, successHref, router]);

  async function start() {
    setPhase("starting");
    setMessage(undefined);
    setResult(undefined);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setStarted(body as Started);
      setPhase("pending");
    } catch (error) {
      setMessage(error instanceof Error && error.message ? error.message : "This is unavailable right now.");
      setPhase("failed");
    }
  }

  if (phase === "idle" || phase === "starting") {
    return (
      <div className="step">
        <div className="muted">{intro}</div>
        <button className="cta" onClick={start} disabled={phase === "starting"}>
          {phase === "starting" ? "Preparing…" : startLabel}
        </button>
      </div>
    );
  }

  if (phase === "pending" && started) {
    return (
      <div className="step" aria-live="polite">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the server */}
        <img className="qr" src={started.qr} alt="QR code to scan with your EUDI wallet" />
        <a className="cta secondary" href={started.uri}>
          Wallet on this phone? Open it
        </a>
        <p className="muted">
          {waiting} The code expires at {new Date(started.expiresAt).toLocaleTimeString()}.
        </p>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="step" aria-live="polite">
        {result ? (
          <div className="result ok-box">
            <h3>{result.title}</h3>
            <ul>
              {result.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="ok">✓ {message ?? "Done"}</p>
        )}
        {!successHref && (
          <button className="cta secondary" onClick={() => setPhase("idle")}>
            {restartLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="step" role="alert">
      <p className="bad">✕ {message ?? "Something went wrong."}</p>
      <button className="cta" onClick={start}>
        Try again
      </button>
    </div>
  );
}
