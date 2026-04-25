# Plan 0002 — Auth hardening

Status: active (Path A live; Path B deferred)
Created: 2026-04-25
Builds on: `0001-research-artifact-first.md`

## Background

V0 admin auth was bearer-token-in-localStorage on `/review`. Cheap to ship, real security holes:
- localStorage token stolen by any XSS in the page
- No revocation without redeploy
- No audit trail (every action attributed to "the token holder")
- Phishing-trivial paste field
- Constant-time-bug surface in worker bearer compare

## Path A — Cloudflare Access (shipping now)

### Setup (manual, one-time)
1. CF Dashboard → Zero Trust → Access → Applications → Add application → Self-hosted
2. **Name**: `high-signal-review`
3. **Domain**: `high-signal-web.sarthakagrawal927.workers.dev`
4. **Path patterns**: `/review`, `/api/admin/*`
5. **Identity providers**: Google (or one-time PIN via email)
6. **Policy**: Allow `email == sarthakagrawal927@gmail.com`
7. Copy `AUD` tag → set as worker env `CF_ACCESS_AUD`
8. Set `CF_ACCESS_TEAM_DOMAIN` worker env to `<team>.cloudflareaccess.com`

### Architecture
```
Browser ── CF Access (Google OAuth) ──► /review (web worker)
                                          │
                                          └──► /api/admin/* (web worker)
                                                  │  verify CF Access JWT
                                                  ▼
                                              env.API binding (service binding to api worker)
                                                  │  internal — no public auth
                                                  ▼
                                              api worker /admin/* (bearer-gated for direct access; web proxy uses internal token)
```

- Browser never sees a token. CF Access cookie attached automatically.
- `/api/admin/*` on web worker verifies `Cf-Access-Jwt-Assertion` JWT against JWKS at the team domain.
- Web proxy forwards with internal `ADMIN_TOKEN` to api worker.
- Modal still hits api worker directly with bearer (deferred to Path B for proper machine split).

### Code surface
- New: `apps/web/src/lib/cf-access.ts` — JWT verify via `jose`
- New: `apps/web/src/app/api/admin/[...path]/route.ts` — proxy to api binding
- Updated: `apps/web/src/app/review/page.tsx` — drop token UI, call same-origin `/api/admin/*`
- API worker unchanged

## Path B — Defer until Path A bites

Triggered when ANY of:
- Need to share access with non-CF-Access user (collaborator, journalist preview)
- Bearer token in `/admin/scores` exposure becomes a real audit gap
- CF Access $7/seat tier limits blocked
- Want full session model (per-user activity log on `/track-record` corrections)

### Path B work
1. **Machine-token split**
   - `/admin/m2m/scores`, `/admin/m2m/sync` — separate `MACHINE_TOKEN` env, bearer-gated
   - `/admin/signals/*`, `/admin/pending-scores` — human-only, CF Access JWT
   - Modal scorer + writer.push_signal use `MACHINE_TOKEN` only
   - HMAC-signed payloads with timestamp + nonce window for stronger m2m guarantees
2. **NextAuth fallback (or replacement) for human auth**
   - Better-auth on D1 (matches `mentionpilot` pattern in `~/Desktop/mentionpilot`)
   - Google OAuth provider, sessions in D1
   - Replaces CF Access if user-level audit / SQL-queryable activity needed
   - Session cookie, no localStorage tokens anywhere
3. **Audit log table**
   - `admin_actions` table: `actor_email`, `action`, `target_id`, `before`, `after`, `at`
   - Populated on every PATCH/DELETE
   - Surface on `/admin` page

## Out of scope
- Per-route rate limiting (handle when bot traffic hits)
- Per-user permissions (single-admin product, not needed yet)
- mTLS for Modal → API (CF Access service token covers this when needed)

## Migration order when moving A → B
1. Ship Path B's m2m split first (adds new routes, doesn't break old)
2. Update Modal to use new m2m URLs + MACHINE_TOKEN
3. Add audit log writes to existing /admin/signals/* handlers
4. (Optional) replace CF Access with better-auth — only if audit + SQL queryability matters
5. Drop `ADMIN_TOKEN` env once nothing references it
