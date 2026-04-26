import { Hono } from "hono";

type Env = { DB: D1Database };

type Outcome = "hit" | "miss" | "push" | "pending";
type Cohort = "all" | "live" | "backfill";

export const trackRecordRoute = new Hono<{ Bindings: Env }>();

function cohortFilter(cohort: Cohort): string {
  if (cohort === "live") return "AND s.slug NOT LIKE 'bf-%'";
  if (cohort === "backfill") return "AND s.slug LIKE 'bf-%'";
  return "";
}

trackRecordRoute.get("/", async (c) => {
  const cohort = (c.req.query("cohort") ?? "all") as Cohort;
  const filter = cohortFilter(cohort);
  const rows = (await c.env.DB.prepare(
    `SELECT s.signal_type, s.confidence, sr.outcome, sr.window_days, sr.forward_return,
            CASE WHEN s.slug LIKE 'bf-%' THEN 1 ELSE 0 END as is_backfill
     FROM score_runs sr
     JOIN signals s ON s.id = sr.signal_id
     WHERE 1=1 ${filter}`,
  ).all()) as {
    results: Array<{
      signalType: string;
      confidence: string;
      outcome: Outcome;
      windowDays: number;
      forwardReturn: number | null;
      is_backfill: number;
    }>;
  };

  const buckets = new Map<
    string,
    { hit: number; miss: number; push: number; pending: number; total: number }
  >();
  for (const r of rows.results ?? []) {
    const b = buckets.get(r.signalType) ?? { hit: 0, miss: 0, push: 0, pending: 0, total: 0 };
    b[r.outcome] += 1;
    b.total += 1;
    buckets.set(r.signalType, b);
  }

  const out = Array.from(buckets.entries()).map(([signalType, b]) => ({
    signalType,
    ...b,
    hitRate: b.hit + b.miss > 0 ? b.hit / (b.hit + b.miss) : null,
  }));

  return c.json({ cohort, buckets: out });
});

trackRecordRoute.get("/cohorts", async (c) => {
  // Return all three at once for the web split UI to render in one round-trip
  const baseQuery = `SELECT s.signal_type, sr.outcome, sr.window_days,
                            CASE WHEN s.slug LIKE 'bf-%' THEN 'backfill' ELSE 'live' END as cohort
                     FROM score_runs sr JOIN signals s ON s.id = sr.signal_id`;
  const rows = (await c.env.DB.prepare(baseQuery).all()) as {
    results: Array<{
      signalType: string;
      outcome: Outcome;
      windowDays: number;
      cohort: "live" | "backfill";
    }>;
  };

  const acc: Record<"live" | "backfill" | "all", Map<string, { hit: number; miss: number; push: number; pending: number; total: number }>> = {
    live: new Map(),
    backfill: new Map(),
    all: new Map(),
  };
  for (const r of rows.results ?? []) {
    for (const k of [r.cohort, "all" as const]) {
      const m = acc[k];
      const b = m.get(r.signalType) ?? { hit: 0, miss: 0, push: 0, pending: 0, total: 0 };
      b[r.outcome] += 1;
      b.total += 1;
      m.set(r.signalType, b);
    }
  }
  const toBuckets = (m: typeof acc.live) =>
    Array.from(m.entries()).map(([signalType, b]) => ({
      signalType,
      ...b,
      hitRate: b.hit + b.miss > 0 ? b.hit / (b.hit + b.miss) : null,
    }));
  return c.json({
    live: toBuckets(acc.live),
    backfill: toBuckets(acc.backfill),
    all: toBuckets(acc.all),
  });
});

trackRecordRoute.get("/series", async (c) => {
  const cohort = (c.req.query("cohort") ?? "all") as Cohort;
  const filter = cohortFilter(cohort);
  const rows = (await c.env.DB.prepare(
    `SELECT date(sr.run_at, 'unixepoch') as d, sr.outcome, count(*) as n
     FROM score_runs sr JOIN signals s ON s.id = sr.signal_id
     WHERE sr.outcome != 'pending' ${filter}
     GROUP BY d, sr.outcome ORDER BY d`,
  ).all()) as { results: Array<{ d: string; outcome: string; n: number }> };
  return c.json({ cohort, series: rows.results ?? [] });
});

export default trackRecordRoute;
