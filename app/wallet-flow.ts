"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * One wallet interaction: start it on the server, show the QR code, poll the
 * server until it reports a result. The server never sends EUDIPLO session
 * IDs, only an opaque `check` where needed. The screens draw the states.
 *
 * Contract of the endpoint:
 *   POST endpoint            -> { qr, uri, expiresAt, check? }
 *   GET  endpoint[?check=…]  -> { state: "pending" | "done" | "failed" | "expired",
 *                                 scanned?, reason?, message?, result? }
 */

export type Started = { qr: string; uri: string; expiresAt: string; check?: string };
export type Phase = "starting" | "ready" | "scanned" | "done" | "failed";

type PollBody<R> = {
  state: "pending" | "done" | "failed" | "expired";
  scanned?: boolean;
  reason?: string;
  message?: string;
  result?: R;
};

export function useWalletFlow<R = unknown>(endpoint: string, onDone?: (result?: R) => void) {
  const [phase, setPhase] = useState<Phase>("starting");
  const [started, setStarted] = useState<Started>();
  const [message, setMessage] = useState<string>();
  const [reason, setReason] = useState<string>();
  const [result, setResult] = useState<R>();
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  const start = useCallback(async () => {
    setPhase("starting");
    setMessage(undefined);
    setReason(undefined);
    setResult(undefined);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setStarted(body as Started);
      setPhase("ready");
    } catch (error) {
      setMessage(error instanceof Error && error.message ? error.message : "This is unavailable right now.");
      setPhase("failed");
    }
  }, [endpoint]);

  // Show the code straight away. The ref keeps React's development double mount from starting twice.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (autoStarted.current) return;
    autoStarted.current = true;
    void start();
  }, [start]);

  useEffect(() => {
    if ((phase !== "ready" && phase !== "scanned") || !started) return;
    let stopped = false;
    const url = started.check ? `${endpoint}?check=${encodeURIComponent(started.check)}` : endpoint;
    const poll = async () => {
      if (stopped) return;
      try {
        const res = await fetch(url, { cache: "no-store" });
        const body = (await res.json()) as PollBody<R>;
        if (stopped) return;
        if (body.state === "done") {
          setResult(body.result);
          setMessage(body.message);
          setPhase("done");
          onDoneRef.current?.(body.result);
          return;
        }
        if (body.state === "failed" || body.state === "expired") {
          setMessage(body.message);
          setReason(body.reason ?? body.state);
          setPhase("failed");
          return;
        }
        if (body.scanned) setPhase("scanned");
      } catch {
        // Try again on the next tick.
      }
      setTimeout(poll, 2000);
    };
    void poll();
    return () => {
      stopped = true;
    };
  }, [phase, started, endpoint]);

  return { phase, started, message, reason, result, start };
}

/** "9:41" until `expiresAt`, updated every second. */
export function useCountdown(expiresAt?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!expiresAt) return undefined;
  const left = Math.max(0, Math.round((Date.parse(expiresAt) - now) / 1000));
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
}
