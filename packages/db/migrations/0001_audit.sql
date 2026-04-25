-- Audit + replay storage. Every event, every LLM call, every cron run captured
-- so 30d-from-now we can ask 'why did this not generate' or 'what bias do
-- we have' from raw data, not memory.

CREATE TABLE `llm_runs` (
  `id` text PRIMARY KEY NOT NULL,
  `signal_slug` text,
  `model` text NOT NULL,
  `prompt_version` text,
  `accepted` integer NOT NULL,
  `reason` text,
  `request_json` text NOT NULL,
  `response_json` text,
  `tokens_in` integer,
  `tokens_out` integer,
  `latency_ms` integer,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `llm_runs_created_idx` ON `llm_runs` (`created_at`);
--> statement-breakpoint
CREATE INDEX `llm_runs_signal_idx` ON `llm_runs` (`signal_slug`);
--> statement-breakpoint
CREATE INDEX `llm_runs_accepted_idx` ON `llm_runs` (`accepted`);
--> statement-breakpoint

CREATE TABLE `ingest_runs` (
  `id` text PRIMARY KEY NOT NULL,
  `source` text NOT NULL,
  `started_at` integer NOT NULL,
  `finished_at` integer,
  `days` integer,
  `events_fetched` integer DEFAULT 0,
  `events_dropped_no_entity` integer DEFAULT 0,
  `events_dropped_low_cluster` integer DEFAULT 0,
  `signals_drafted` integer DEFAULT 0,
  `errors` integer DEFAULT 0,
  `error_sample` text,
  `notes` text
);
--> statement-breakpoint
CREATE INDEX `ingest_runs_source_idx` ON `ingest_runs` (`source`);
--> statement-breakpoint
CREATE INDEX `ingest_runs_started_idx` ON `ingest_runs` (`started_at`);
--> statement-breakpoint

-- The existing `events` table was defined but never populated. It already lives in
-- schema 0000. Add a 'fetch_run_id' link so we can replay which events came from which run.
ALTER TABLE `events` ADD COLUMN `fetch_run_id` text;
--> statement-breakpoint
CREATE INDEX `events_fetch_run_idx` ON `events` (`fetch_run_id`);
