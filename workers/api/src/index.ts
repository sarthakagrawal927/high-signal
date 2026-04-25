import { Hono } from "hono";
import { cors } from "hono/cors";
import { signalsRoute } from "./routes/signals";
import { entitiesRoute } from "./routes/entities";
import { trackRecordRoute } from "./routes/track-record";
import { digestRoute } from "./routes/digest";

type Env = {
  DB: D1Database;
  ENVIRONMENT: string;
  MODAL_TRIGGER_URL?: string;
  MODAL_TRIGGER_TOKEN?: string;
};

const app = new Hono<{ Bindings: Env }>();
app.use("*", cors({ origin: "*" }));

app.get("/", (c) => c.json({ name: "high-signal-api", env: c.env.ENVIRONMENT }));
app.get("/health", (c) => c.json({ ok: true, ts: Date.now() }));

app.route("/signals", signalsRoute);
app.route("/entities", entitiesRoute);
app.route("/track-record", trackRecordRoute);
app.route("/digest", digestRoute);

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    if (env.MODAL_TRIGGER_URL && env.MODAL_TRIGGER_TOKEN) {
      ctx.waitUntil(
        fetch(env.MODAL_TRIGGER_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.MODAL_TRIGGER_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ source: "all", days: 1 }),
        }).then((r) => console.log("[cron] modal trigger status:", r.status)),
      );
    } else {
      console.log("[cron] MODAL_TRIGGER_* not set — skipping ingest dispatch");
    }
  },
};
