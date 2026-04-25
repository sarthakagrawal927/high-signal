import { Hono } from "hono";

type Env = {
  DB: D1Database;
  ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => c.json({ name: "high-signal-api", env: c.env.ENVIRONMENT }));

app.get("/health", (c) => c.json({ ok: true, ts: Date.now() }));

app.get("/signals", async (c) => {
  // TODO: query c.env.DB via Drizzle
  return c.json({ signals: [] });
});

app.get("/entities/:id", async (c) => {
  const id = c.req.param("id");
  // TODO: query c.env.DB
  return c.json({ id, signals: [] });
});

app.get("/track-record", async (c) => {
  // TODO: aggregate score_runs
  return c.json({ hitRateBySignalType: [] });
});

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    // TODO: trigger Modal ingest job, then write events to env.DB
    console.log("[cron] ingest tick", { env: env.ENVIRONMENT });
  },
};
