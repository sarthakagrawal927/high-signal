import { Hono } from "hono";
import { db, schema } from "../db";

type Env = { DB: D1Database };

type Score = {
  signalType: string;
  outcome: "hit" | "miss" | "push" | "pending";
  windowDays: number;
};

export const trackRecordRoute = new Hono<{ Bindings: Env }>();

trackRecordRoute.get("/", async (c) => {
  // Join score_runs to signals for signal_type bucket
  const rows = (await c.env.DB.prepare(
    `SELECT s.signal_type, s.confidence, sr.outcome, sr.window_days, sr.forward_return
     FROM score_runs sr
     JOIN signals s ON s.id = sr.signal_id`,
  ).all()) as { results: Array<Score & { confidence: string; forward_return: number | null }> };

  const buckets = new Map<
    string,
    { hit: number; miss: number; push: number; pending: number; total: number }
  >();
  for (const r of rows.results ?? []) {
    const k = r.signalType;
    const b = buckets.get(k) ?? { hit: 0, miss: 0, push: 0, pending: 0, total: 0 };
    b[r.outcome] += 1;
    b.total += 1;
    buckets.set(k, b);
  }

  const out = Array.from(buckets.entries()).map(([signalType, b]) => ({
    signalType,
    ...b,
    hitRate: b.total > 0 ? b.hit / Math.max(1, b.hit + b.miss) : null,
  }));

  return c.json({ buckets: out });
});

trackRecordRoute.get("/series", async (c) => {
  const rows = (await c.env.DB.prepare(
    `SELECT date(run_at, 'unixepoch') as d, outcome, count(*) as n
     FROM score_runs
     WHERE outcome != 'pending'
     GROUP BY d, outcome
     ORDER BY d`,
  ).all()) as { results: Array<{ d: string; outcome: string; n: number }> };
  return c.json({ series: rows.results ?? [] });
});

export default trackRecordRoute;
