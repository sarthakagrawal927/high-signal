/**
 * Admin write routes — bearer-token auth via env.ADMIN_TOKEN.
 *
 * Modal scorer POSTs forward-return rows to /admin/scores.
 * CI / local sync-signals.ts POSTs frontmatter+body to /admin/sync to keep D1 in step with the git-versioned signals/ tree.
 */
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db, schema } from "../db";

type Env = { DB: D1Database; ADMIN_TOKEN?: string };

export const adminRoute = new Hono<{ Bindings: Env }>();

adminRoute.use("*", async (c, next) => {
  const token = c.env.ADMIN_TOKEN;
  if (!token) return c.json({ error: "admin_disabled" }, 503);
  const auth = c.req.header("Authorization") ?? "";
  if (auth !== `Bearer ${token}`) return c.json({ error: "unauthorized" }, 401);
  await next();
});

interface ScoreRunInput {
  signalId: string;
  windowDays: number;
  forwardReturn: number | null;
  outcome: "hit" | "miss" | "push" | "pending";
  notes?: string;
}

adminRoute.post("/scores", async (c) => {
  const body = (await c.req.json()) as { runs?: ScoreRunInput[] };
  const runs = body.runs ?? [];
  if (!Array.isArray(runs)) return c.json({ error: "bad_payload" }, 400);

  const inserted: string[] = [];
  for (const r of runs) {
    if (!r.signalId || typeof r.windowDays !== "number" || !r.outcome) continue;
    const id = await sha16(`${r.signalId}:${r.windowDays}:${Date.now()}:${Math.random()}`);
    await db(c.env.DB)
      .insert(schema.scoreRuns)
      .values({
        id,
        signalId: r.signalId,
        runAt: new Date(),
        windowDays: r.windowDays,
        forwardReturn: r.forwardReturn,
        outcome: r.outcome,
        notes: r.notes ?? null,
      });
    inserted.push(id);
  }
  return c.json({ inserted: inserted.length, ids: inserted });
});

interface SignalUpsert {
  slug: string;
  signalType: string;
  primaryEntityId: string;
  direction: "up" | "down" | "neutral";
  confidence: "low" | "medium" | "high";
  predictedWindowDays: number;
  publishedAt: string; // ISO
  evidenceUrls: string[];
  spilloverEntityIds?: string[];
  reviewStatus?: "draft" | "published" | "corrected";
  supersedesSignalId?: string | null;
  bodyMd: string;
}

adminRoute.post("/sync", async (c) => {
  const body = (await c.req.json()) as { signals?: SignalUpsert[] };
  const sigs = body.signals ?? [];
  let upserts = 0;
  for (const s of sigs) {
    const id = await sha16(s.slug);
    await db(c.env.DB)
      .insert(schema.signals)
      .values({
        id,
        slug: s.slug,
        signalType: s.signalType,
        primaryEntityId: s.primaryEntityId,
        direction: s.direction,
        confidence: s.confidence,
        predictedWindowDays: s.predictedWindowDays,
        publishedAt: new Date(s.publishedAt),
        evidenceUrls: s.evidenceUrls,
        spilloverEntityIds: s.spilloverEntityIds ?? [],
        reviewStatus: s.reviewStatus ?? "draft",
        supersedesSignalId: s.supersedesSignalId ?? null,
        bodyMd: s.bodyMd,
      })
      .onConflictDoUpdate({
        target: schema.signals.id,
        set: {
          signalType: s.signalType,
          direction: s.direction,
          confidence: s.confidence,
          predictedWindowDays: s.predictedWindowDays,
          publishedAt: new Date(s.publishedAt),
          evidenceUrls: s.evidenceUrls,
          spilloverEntityIds: s.spilloverEntityIds ?? [],
          reviewStatus: s.reviewStatus ?? "draft",
          supersedesSignalId: s.supersedesSignalId ?? null,
          bodyMd: s.bodyMd,
        },
      });

    // Replace evidence rows
    await db(c.env.DB).delete(schema.evidence).where(eq(schema.evidence.signalId, id));
    for (const url of s.evidenceUrls) {
      await db(c.env.DB)
        .insert(schema.evidence)
        .values({
          id: await sha16(`${id}:${url}`),
          signalId: id,
          url,
          sourceType: inferSourceType(url),
          excerpt: null,
          publishedAt: null,
        });
    }
    upserts++;
  }
  return c.json({ upserts });
});

adminRoute.get("/pending-scores", async (c) => {
  // Signals whose predicted window has elapsed and no score_run exists yet for that window.
  const rows = (await c.env.DB.prepare(
    `SELECT s.id, s.slug, s.primary_entity_id, s.direction, s.confidence, s.predicted_window_days, s.published_at
     FROM signals s
     WHERE s.review_status = 'published'
       AND (s.published_at + s.predicted_window_days * 86400) <= unixepoch()
       AND NOT EXISTS (
         SELECT 1 FROM score_runs sr
         WHERE sr.signal_id = s.id AND sr.window_days = s.predicted_window_days
       )
     LIMIT 200`,
  ).all()) as {
    results: Array<{
      id: string;
      slug: string;
      primary_entity_id: string;
      direction: string;
      confidence: string;
      predicted_window_days: number;
      published_at: number;
    }>;
  };
  return c.json({ pending: rows.results ?? [] });
});

async function sha16(s: string): Promise<string> {
  const data = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

function inferSourceType(url: string): string {
  if (url.includes("sec.gov")) return "edgar";
  if (url.includes("reddit.com")) return "reddit";
  if (url.includes("github.com")) return "github";
  if (url.includes("twitter.com") || url.includes("x.com")) return "x";
  return "web";
}
