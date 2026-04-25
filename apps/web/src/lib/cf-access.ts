/**
 * Cloudflare Access JWT verification.
 *
 * CF Access fronts protected paths with Google OAuth (or other IdP) and
 * attaches a signed JWT to every authenticated request as the
 * `Cf-Access-Jwt-Assertion` header (and a cookie for redirects).
 *
 * Server-side, we verify the JWT signature against the team's JWKS endpoint,
 * confirm the audience claim matches our app's AUD, and trust the contained
 * `email` claim for authorization decisions.
 *
 * Setup (manual, one-time):
 *   1. CF dashboard → Zero Trust → Access → Applications → Add → Self-hosted
 *   2. Domain + path: high-signal-web.<workers.dev>/review and /api/admin/*
 *   3. Policy: Allow email == sarthakagrawal927@gmail.com
 *   4. Copy AUD tag → set CF_ACCESS_AUD env on web worker
 *   5. Set CF_ACCESS_TEAM_DOMAIN to <team>.cloudflareaccess.com
 */

import { createRemoteJWKSet, jwtVerify } from "jose";

export interface AccessClaims {
  email: string;
  sub: string;
}

let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks(teamDomain: string) {
  if (_jwks) return _jwks;
  _jwks = createRemoteJWKSet(
    new URL(`https://${teamDomain}/cdn-cgi/access/certs`),
  );
  return _jwks;
}

export async function verifyAccess(req: Request): Promise<AccessClaims | null> {
  const teamDomain = process.env.CF_ACCESS_TEAM_DOMAIN;
  const aud = process.env.CF_ACCESS_AUD;
  if (!teamDomain || !aud) return null; // not configured — caller decides

  const token =
    req.headers.get("cf-access-jwt-assertion") ??
    parseCookie(req.headers.get("cookie") ?? "")["CF_Authorization"];
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwks(teamDomain), {
      audience: aud,
      issuer: `https://${teamDomain}`,
    });
    if (typeof payload.email !== "string" || typeof payload.sub !== "string") {
      return null;
    }
    return { email: payload.email, sub: payload.sub };
  } catch {
    return null;
  }
}

function parseCookie(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of s.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

const ALLOWED_EMAILS = (process.env.ADMIN_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function isAllowed(email: string): boolean {
  if (ALLOWED_EMAILS.length === 0) return true; // CF Access policy is the gate
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}
