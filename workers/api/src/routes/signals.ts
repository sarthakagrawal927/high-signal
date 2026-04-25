import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "../db";

type Env = { DB: D1Database };

export const signalsRoute = new Hono<{ Bindings: Env }>();

signalsRoute.get("/", async (c) => {
  const status = c.req.query("status") ?? "published";
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 200);
  const rows = await db(c.env.DB)
    .select()
    .from(schema.signals)
    .where(eq(schema.signals.reviewStatus, status as "draft" | "published" | "corrected"))
    .orderBy(desc(schema.signals.publishedAt))
    .limit(limit);
  return c.json({ signals: rows });
});

signalsRoute.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const [row] = await db(c.env.DB)
    .select()
    .from(schema.signals)
    .where(eq(schema.signals.slug, slug))
    .limit(1);
  if (!row) return c.json({ error: "not_found" }, 404);
  const evid = await db(c.env.DB)
    .select()
    .from(schema.evidence)
    .where(eq(schema.evidence.signalId, row.id));
  const scores = await db(c.env.DB)
    .select()
    .from(schema.scoreRuns)
    .where(eq(schema.scoreRuns.signalId, row.id));
  return c.json({ signal: row, evidence: evid, scores });
});

signalsRoute.get("/by-entity/:entityId", async (c) => {
  const entityId = c.req.param("entityId");
  const rows = await db(c.env.DB)
    .select()
    .from(schema.signals)
    .where(eq(schema.signals.primaryEntityId, entityId))
    .orderBy(desc(schema.signals.publishedAt));
  return c.json({ signals: rows });
});
