import "server-only";

/**
 * Minimal EUDIPLO client for The Pearls. It uses the least-privilege app
 * client (presentation:request and issuance:offer, limited to this hotel's
 * configurations). Server only: neither the secret nor EUDIPLO's session IDs
 * reach the browser.
 */

// Read at request time, so the app builds without secrets.
const baseUrl = () => required("EUDIPLO_URL").replace(/\/+$/, "");

export const ids = {
  guestPresentation: () => process.env.GUEST_PRESENTATION_ID ?? "guest-pid",
  bookingPresentation: () => process.env.BOOKING_PRESENTATION_ID ?? "booking-check",
  bookingCredential: () => process.env.BOOKING_CREDENTIAL_ID ?? "booking",
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

let cachedToken: { value: string; expiresAt: number } | undefined;

async function token(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;
  const res = await fetch(`${baseUrl()}/api/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: required("EUDIPLO_CLIENT_ID"),
      client_secret: required("EUDIPLO_CLIENT_SECRET"),
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`EUDIPLO token request failed (${res.status})`);
  const body = (await res.json()) as { access_token: string; expires_in?: number };
  cachedToken = { value: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 300) * 1000 };
  return cachedToken.value;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} failed (${res.status}): ${await res.text()}`);
  }
  return (await res.json()) as T;
}

/** Starts a presentation. `reference` is our own ID, never personal data. */
export function createPresentation(requestId: string, reference: string) {
  return api<{ uri: string; crossDeviceUri: string; session: string }>("/api/verifier/offer", {
    method: "POST",
    body: JSON.stringify({ response_type: "uri", requestId, reference }),
  });
}

/**
 * Creates a single-use, pre-authorized credential offer. Never fetch the
 * returned URI yourself: the first fetch consumes the offer.
 */
export function createOffer(credentialId: string, claims: Record<string, unknown>, lifetimeSeconds: number) {
  return api<{ session: string; uri: string }>("/api/issuer/offer", {
    method: "POST",
    body: JSON.stringify({
      response_type: "uri",
      flow: "pre_authorized_code",
      credentialConfigurationIds: [credentialId],
      credentialClaims: { [credentialId]: { type: "inline", claims } },
      offerLifetimeSeconds: lifetimeSeconds,
    }),
  });
}

export type Session = {
  id: string;
  status: "active" | "fetched" | "completed" | "failed" | "expired";
  expiresAt?: string;
  credentials?: { id: string; values: Record<string, unknown>[] }[];
  outcome?: { result?: string; error?: string; message?: string };
  failureCode?: string;
};

export function getSession(sessionId: string) {
  return api<Session>(`/api/session/${encodeURIComponent(sessionId)}`);
}

const failureMessages: Record<string, string> = {
  access_denied: "You declined the request in your wallet.",
  trust_chain_not_trusted: "This document isn't accepted here.",
  no_trust_chain_to_root: "This document isn't accepted here.",
  certificate_expired: "This document has expired.",
  signature_invalid: "This document could not be verified.",
};

/** A guest-friendly message for a failed presentation. */
export function failureMessage(session: Session) {
  const code = session.outcome?.error ?? session.failureCode ?? "";
  return failureMessages[code] ?? "We couldn't verify the document.";
}
