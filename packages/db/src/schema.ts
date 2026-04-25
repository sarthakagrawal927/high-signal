import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const entities = sqliteTable(
  "entities",
  {
    id: text("id").primaryKey(),
    ticker: text("ticker"),
    name: text("name").notNull(),
    type: text("type", { enum: ["public", "private", "sector", "product"] }).notNull(),
    country: text("country"),
    sector: text("sector"),
    metadata: text("metadata", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("entities_ticker_idx").on(t.ticker), index("entities_sector_idx").on(t.sector)],
);

export const relationships = sqliteTable(
  "relationships",
  {
    id: text("id").primaryKey(),
    fromEntityId: text("from_entity_id")
      .notNull()
      .references(() => entities.id),
    toEntityId: text("to_entity_id")
      .notNull()
      .references(() => entities.id),
    type: text("type", {
      enum: ["supplier", "customer", "peer", "subsidiary", "partner", "competitor"],
    }).notNull(),
    weight: real("weight").default(1.0),
    verified: integer("verified", { mode: "boolean" }).default(false),
    evidenceUrl: text("evidence_url"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("relationships_from_idx").on(t.fromEntityId),
    index("relationships_to_idx").on(t.toEntityId),
    uniqueIndex("relationships_unique").on(t.fromEntityId, t.toEntityId, t.type),
  ],
);

export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    source: text("source").notNull(),
    sourceUrl: text("source_url").notNull(),
    publishedAt: integer("published_at", { mode: "timestamp" }).notNull(),
    title: text("title"),
    content: text("content"),
    primaryEntityId: text("primary_entity_id").references(() => entities.id),
    rawHash: text("raw_hash").notNull(),
    fetchRunId: text("fetch_run_id"),
    ingestedAt: integer("ingested_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("events_raw_hash_idx").on(t.rawHash),
    index("events_published_idx").on(t.publishedAt),
    index("events_primary_entity_idx").on(t.primaryEntityId),
    index("events_fetch_run_idx").on(t.fetchRunId),
  ],
);

export const signals = sqliteTable(
  "signals",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    signalType: text("signal_type").notNull(),
    primaryEntityId: text("primary_entity_id")
      .notNull()
      .references(() => entities.id),
    direction: text("direction", { enum: ["up", "down", "neutral"] }).notNull(),
    confidence: text("confidence", { enum: ["low", "medium", "high"] }).notNull(),
    predictedWindowDays: integer("predicted_window_days").notNull(),
    publishedAt: integer("published_at", { mode: "timestamp" }).notNull(),
    evidenceUrls: text("evidence_urls", { mode: "json" }).notNull(),
    spilloverEntityIds: text("spillover_entity_ids", { mode: "json" }),
    reviewStatus: text("review_status", {
      enum: ["draft", "published", "corrected"],
    })
      .notNull()
      .default("draft"),
    supersedesSignalId: text("supersedes_signal_id"),
    bodyMd: text("body_md").notNull(),
  },
  (t) => [
    uniqueIndex("signals_slug_idx").on(t.slug),
    index("signals_published_idx").on(t.publishedAt),
    index("signals_primary_entity_idx").on(t.primaryEntityId),
    index("signals_type_idx").on(t.signalType),
  ],
);

export const evidence = sqliteTable(
  "evidence",
  {
    id: text("id").primaryKey(),
    signalId: text("signal_id")
      .notNull()
      .references(() => signals.id),
    url: text("url").notNull(),
    sourceType: text("source_type").notNull(),
    excerpt: text("excerpt"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
  },
  (t) => [index("evidence_signal_idx").on(t.signalId)],
);

export const scoreRuns = sqliteTable(
  "score_runs",
  {
    id: text("id").primaryKey(),
    signalId: text("signal_id")
      .notNull()
      .references(() => signals.id),
    runAt: integer("run_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    windowDays: integer("window_days").notNull(),
    forwardReturn: real("forward_return"),
    outcome: text("outcome", {
      enum: ["hit", "miss", "push", "pending"],
    }).notNull(),
    notes: text("notes"),
  },
  (t) => [
    index("score_runs_signal_idx").on(t.signalId),
    index("score_runs_run_at_idx").on(t.runAt),
  ],
);

// Audit / replay storage — everything we'd want to debug 30d from now without
// access to memory. Append-only, never updated.

export const llmRuns = sqliteTable(
  "llm_runs",
  {
    id: text("id").primaryKey(),
    signalSlug: text("signal_slug"),
    model: text("model").notNull(),
    promptVersion: text("prompt_version"),
    accepted: integer("accepted", { mode: "boolean" }).notNull(),
    reason: text("reason"),
    requestJson: text("request_json", { mode: "json" }).notNull(),
    responseJson: text("response_json", { mode: "json" }),
    tokensIn: integer("tokens_in"),
    tokensOut: integer("tokens_out"),
    latencyMs: integer("latency_ms"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("llm_runs_created_idx").on(t.createdAt),
    index("llm_runs_signal_idx").on(t.signalSlug),
    index("llm_runs_accepted_idx").on(t.accepted),
  ],
);

export const ingestRuns = sqliteTable(
  "ingest_runs",
  {
    id: text("id").primaryKey(),
    source: text("source").notNull(),
    startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
    finishedAt: integer("finished_at", { mode: "timestamp" }),
    days: integer("days"),
    eventsFetched: integer("events_fetched").default(0),
    eventsDroppedNoEntity: integer("events_dropped_no_entity").default(0),
    eventsDroppedLowCluster: integer("events_dropped_low_cluster").default(0),
    signalsDrafted: integer("signals_drafted").default(0),
    errors: integer("errors").default(0),
    errorSample: text("error_sample"),
    notes: text("notes"),
  },
  (t) => [
    index("ingest_runs_source_idx").on(t.source),
    index("ingest_runs_started_idx").on(t.startedAt),
  ],
);
