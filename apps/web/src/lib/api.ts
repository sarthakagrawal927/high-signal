// Default to deployed prod API. Override at build time with NEXT_PUBLIC_API_BASE for local dev.
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://high-signal-api.sarthakagrawal927.workers.dev";

// Service binding when running inside the high-signal-web Worker (avoids CF
// "fetch loop" guard that blocks workers.dev → workers.dev fetches in the same
// account). Resolved lazily so it works in both Worker SSR and `next dev`.
async function getBinding(): Promise<{ fetch: typeof fetch } | null> {
  if (typeof process === "undefined") return null;
  try {
    const mod = await import("@opennextjs/cloudflare");
    const ctx = (mod as { getCloudflareContext?: () => { env?: Record<string, unknown> } })
      .getCloudflareContext?.();
    const api = ctx?.env?.["API"];
    if (api && typeof (api as { fetch?: unknown }).fetch === "function") {
      return api as { fetch: typeof fetch };
    }
  } catch {
    /* not in Worker context */
  }
  return null;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const binding = await getBinding();
  let r: Response;
  if (binding) {
    r = await binding.fetch(`https://api${path}`, init);
  } else {
    r = await fetch(`${API_BASE}${path}`, { ...init, cache: "no-store" });
  }
  if (!r.ok) throw new Error(`api ${path} ${r.status}`);
  return r.json() as Promise<T>;
}

export type Direction = "up" | "down" | "neutral";
export type Confidence = "low" | "medium" | "high";
export type Outcome = "hit" | "miss" | "push" | "pending";

export interface SignalRow {
  id: string;
  slug: string;
  signalType: string;
  primaryEntityId: string;
  direction: Direction;
  confidence: Confidence;
  predictedWindowDays: number;
  publishedAt: number;
  evidenceUrls: string[];
  spilloverEntityIds: string[];
  reviewStatus: "draft" | "published" | "corrected";
  bodyMd: string;
}

export interface EntityRow {
  id: string;
  ticker: string | null;
  name: string;
  type: "public" | "private" | "sector" | "product";
  country: string | null;
  sector: string | null;
}

export interface RelationshipRow {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  type: "supplier" | "customer" | "peer" | "subsidiary" | "partner" | "competitor";
  weight: number;
  verified: boolean;
}

export interface TrackBucket {
  signalType: string;
  hit: number;
  miss: number;
  push: number;
  pending: number;
  total: number;
  hitRate: number | null;
}

export interface SignalFilters {
  type?: string;
  direction?: Direction;
  confidence?: Confidence;
  entity?: string;
  status?: "draft" | "published" | "corrected";
}

export interface Facets {
  types: { k: string; n: number }[];
  directions: { k: string; n: number }[];
  confidences: { k: string; n: number }[];
  topEntities: { k: string; n: number }[];
}

function qs(o: Record<string, string | undefined>): string {
  const e = Object.entries(o).filter(([, v]) => v != null && v !== "");
  return e.length ? `?${new URLSearchParams(e as [string, string][]).toString()}` : "";
}

export const api = {
  signals: (f: SignalFilters = {}) =>
    fetchJson<{ signals: SignalRow[] }>(`/signals${qs(f)}`),
  facets: () => fetchJson<Facets>("/signals/facets"),
  signal: (slug: string) =>
    fetchJson<{
      signal: SignalRow;
      evidence: Array<{ id: string; url: string; sourceType: string; excerpt: string | null }>;
      scores: Array<{ id: string; outcome: Outcome; windowDays: number; forwardReturn: number | null }>;
    }>(`/signals/${slug}`),
  entities: () => fetchJson<{ entities: EntityRow[] }>("/entities"),
  entity: (id: string) =>
    fetchJson<{
      entity: EntityRow;
      relationships: RelationshipRow[];
      signals: SignalRow[];
    }>(`/entities/${id}`),
  trackRecord: () => fetchJson<{ buckets: TrackBucket[] }>("/track-record"),
  trackRecordCohorts: () =>
    fetchJson<{ live: TrackBucket[]; backfill: TrackBucket[]; all: TrackBucket[] }>(
      "/track-record/cohorts",
    ),
  sectors: (days = 60) =>
    fetchJson<{
      days: number;
      sectors: Array<{
        sector: string;
        signalCount: number;
        upCount: number;
        downCount: number;
        neutralCount: number;
        netDirection: number;
        topEntities: string[];
        hits: number;
        misses: number;
        pushes: number;
        hitRate: number | null;
      }>;
    }>(`/sectors?days=${days}`),
  digestWeekly: () =>
    fetchJson<{ since: string; signals: SignalRow[] }>("/digest/weekly"),
};
