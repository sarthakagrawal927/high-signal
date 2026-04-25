const API_BASE = process.env["NEXT_PUBLIC_API_BASE"] ?? "http://127.0.0.1:8787";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    ...init,
    next: { revalidate: 60 },
  });
  if (!r.ok) throw new Error(`api ${path} ${r.status}`);
  return r.json();
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
  digestWeekly: () =>
    fetchJson<{ since: string; signals: SignalRow[] }>("/digest/weekly"),
};
