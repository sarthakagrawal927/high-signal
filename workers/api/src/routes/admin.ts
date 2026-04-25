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

adminRoute.patch("/signals/:slug", async (c) => {
  const slug = c.req.param("slug");
  const body = (await c.req.json()) as {
    reviewStatus?: "draft" | "published" | "corrected";
    supersedesSignalId?: string | null;
  };
  const updates: Record<string, unknown> = {};
  if (body.reviewStatus) updates.reviewStatus = body.reviewStatus;
  if ("supersedesSignalId" in body) updates.supersedesSignalId = body.supersedesSignalId;
  if (Object.keys(updates).length === 0) {
    return c.json({ error: "no_updates" }, 400);
  }
  const result = await db(c.env.DB)
    .update(schema.signals)
    .set(updates as Partial<typeof schema.signals.$inferInsert>)
    .where(eq(schema.signals.slug, slug))
    .returning({ id: schema.signals.id, slug: schema.signals.slug, reviewStatus: schema.signals.reviewStatus });
  if (result.length === 0) return c.json({ error: "not_found" }, 404);
  return c.json({ updated: result[0] });
});

adminRoute.delete("/signals/:slug", async (c) => {
  const slug = c.req.param("slug");
  const [row] = await db(c.env.DB)
    .select({ id: schema.signals.id })
    .from(schema.signals)
    .where(eq(schema.signals.slug, slug))
    .limit(1);
  if (!row) return c.json({ error: "not_found" }, 404);
  await db(c.env.DB).delete(schema.evidence).where(eq(schema.evidence.signalId, row.id));
  await db(c.env.DB).delete(schema.scoreRuns).where(eq(schema.scoreRuns.signalId, row.id));
  await db(c.env.DB).delete(schema.signals).where(eq(schema.signals.id, row.id));
  return c.json({ deleted: row.id });
});

// Audit ingest — bulk-insert raw events, llm_runs, ingest_runs from Modal.

interface EventInput {
  source: string;
  sourceUrl: string;
  publishedAt: string;
  title?: string;
  content?: string;
  primaryEntityId?: string | null;
  rawHash: string;
  fetchRunId?: string | null;
}

adminRoute.post("/events", async (c) => {
  const body = (await c.req.json()) as { events?: EventInput[] };
  const events = body.events ?? [];
  let inserted = 0;
  for (const e of events) {
    const id = await sha16(e.rawHash);
    try {
      await db(c.env.DB)
        .insert(schema.events)
        .values({
          id,
          source: e.source,
          sourceUrl: e.sourceUrl,
          publishedAt: new Date(e.publishedAt),
          title: e.title ?? null,
          content: e.content ?? null,
          primaryEntityId: e.primaryEntityId ?? null,
          rawHash: e.rawHash,
          fetchRunId: e.fetchRunId ?? null,
        })
        .onConflictDoNothing({ target: schema.events.rawHash });
      inserted++;
    } catch {
      // ignore — dupe or FK miss; raw_hash unique guards the rest
    }
  }
  return c.json({ inserted });
});

interface LlmRunInput {
  signalSlug?: string | null;
  model: string;
  promptVersion?: string;
  accepted: boolean;
  reason?: string;
  requestJson: unknown;
  responseJson?: unknown;
  tokensIn?: number;
  tokensOut?: number;
  latencyMs?: number;
}

adminRoute.post("/llm-runs", async (c) => {
  const body = (await c.req.json()) as { runs?: LlmRunInput[] };
  const runs = body.runs ?? [];
  for (const r of runs) {
    const id = await sha16(`llm:${r.signalSlug ?? ""}:${Date.now()}:${Math.random()}`);
    await db(c.env.DB).insert(schema.llmRuns).values({
      id,
      signalSlug: r.signalSlug ?? null,
      model: r.model,
      promptVersion: r.promptVersion ?? null,
      accepted: r.accepted,
      reason: r.reason ?? null,
      requestJson: r.requestJson,
      responseJson: r.responseJson ?? null,
      tokensIn: r.tokensIn ?? null,
      tokensOut: r.tokensOut ?? null,
      latencyMs: r.latencyMs ?? null,
      createdAt: new Date(),
    });
  }
  return c.json({ inserted: runs.length });
});

interface IngestRunInput {
  source: string;
  startedAt: string;
  finishedAt?: string;
  days?: number;
  eventsFetched?: number;
  eventsDroppedNoEntity?: number;
  eventsDroppedLowCluster?: number;
  signalsDrafted?: number;
  errors?: number;
  errorSample?: string;
  notes?: string;
}

adminRoute.post("/ingest-runs", async (c) => {
  const body = (await c.req.json()) as IngestRunInput;
  const id = await sha16(`run:${body.source}:${body.startedAt}:${Math.random()}`);
  await db(c.env.DB).insert(schema.ingestRuns).values({
    id,
    source: body.source,
    startedAt: new Date(body.startedAt),
    finishedAt: body.finishedAt ? new Date(body.finishedAt) : null,
    days: body.days ?? null,
    eventsFetched: body.eventsFetched ?? 0,
    eventsDroppedNoEntity: body.eventsDroppedNoEntity ?? 0,
    eventsDroppedLowCluster: body.eventsDroppedLowCluster ?? 0,
    signalsDrafted: body.signalsDrafted ?? 0,
    errors: body.errors ?? 0,
    errorSample: body.errorSample ?? null,
    notes: body.notes ?? null,
  });
  return c.json({ id });
});

adminRoute.get("/audit/summary", async (c) => {
  const days = Number(c.req.query("days") ?? 7);
  const since = Math.floor(Date.now() / 1000) - days * 86400;

  const events = (await c.env.DB.prepare(
    `SELECT source, count(*) as n FROM events WHERE ingested_at >= ? GROUP BY source ORDER BY n DESC`,
  )
    .bind(since)
    .all()) as { results: Array<{ source: string; n: number }> };

  const llm = (await c.env.DB.prepare(
    `SELECT model, accepted, count(*) as n, avg(latency_ms) as avg_ms
     FROM llm_runs WHERE created_at >= ? GROUP BY model, accepted`,
  )
    .bind(since)
    .all()) as {
    results: Array<{ model: string; accepted: number; n: number; avg_ms: number | null }>;
  };

  const runs = (await c.env.DB.prepare(
    `SELECT source, count(*) as n,
            sum(events_fetched) as fetched, sum(signals_drafted) as drafted,
            sum(errors) as errors
     FROM ingest_runs WHERE started_at >= ? GROUP BY source`,
  )
    .bind(since)
    .all()) as {
    results: Array<{
      source: string;
      n: number;
      fetched: number;
      drafted: number;
      errors: number;
    }>;
  };

  return c.json({
    sinceDays: days,
    eventsBySource: events.results ?? [],
    llmRuns: llm.results ?? [],
    ingestRuns: runs.results ?? [],
  });
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
