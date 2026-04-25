CREATE TABLE `entities` (
  `id` text PRIMARY KEY NOT NULL,
  `ticker` text,
  `name` text NOT NULL,
  `type` text NOT NULL,
  `country` text,
  `sector` text,
  `metadata` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `entities_ticker_idx` ON `entities` (`ticker`);
--> statement-breakpoint
CREATE INDEX `entities_sector_idx` ON `entities` (`sector`);
--> statement-breakpoint
CREATE TABLE `relationships` (
  `id` text PRIMARY KEY NOT NULL,
  `from_entity_id` text NOT NULL,
  `to_entity_id` text NOT NULL,
  `type` text NOT NULL,
  `weight` real DEFAULT 1.0,
  `verified` integer DEFAULT 0,
  `evidence_url` text,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`from_entity_id`) REFERENCES `entities`(`id`),
  FOREIGN KEY (`to_entity_id`) REFERENCES `entities`(`id`)
);
--> statement-breakpoint
CREATE INDEX `relationships_from_idx` ON `relationships` (`from_entity_id`);
--> statement-breakpoint
CREATE INDEX `relationships_to_idx` ON `relationships` (`to_entity_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `relationships_unique` ON `relationships` (`from_entity_id`, `to_entity_id`, `type`);
--> statement-breakpoint
CREATE TABLE `events` (
  `id` text PRIMARY KEY NOT NULL,
  `source` text NOT NULL,
  `source_url` text NOT NULL,
  `published_at` integer NOT NULL,
  `title` text,
  `content` text,
  `primary_entity_id` text,
  `raw_hash` text NOT NULL,
  `ingested_at` integer NOT NULL,
  FOREIGN KEY (`primary_entity_id`) REFERENCES `entities`(`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_raw_hash_idx` ON `events` (`raw_hash`);
--> statement-breakpoint
CREATE INDEX `events_published_idx` ON `events` (`published_at`);
--> statement-breakpoint
CREATE INDEX `events_primary_entity_idx` ON `events` (`primary_entity_id`);
--> statement-breakpoint
CREATE TABLE `signals` (
  `id` text PRIMARY KEY NOT NULL,
  `slug` text NOT NULL,
  `signal_type` text NOT NULL,
  `primary_entity_id` text NOT NULL,
  `direction` text NOT NULL,
  `confidence` text NOT NULL,
  `predicted_window_days` integer NOT NULL,
  `published_at` integer NOT NULL,
  `evidence_urls` text NOT NULL,
  `spillover_entity_ids` text,
  `review_status` text DEFAULT 'draft' NOT NULL,
  `supersedes_signal_id` text,
  `body_md` text NOT NULL,
  FOREIGN KEY (`primary_entity_id`) REFERENCES `entities`(`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `signals_slug_idx` ON `signals` (`slug`);
--> statement-breakpoint
CREATE INDEX `signals_published_idx` ON `signals` (`published_at`);
--> statement-breakpoint
CREATE INDEX `signals_primary_entity_idx` ON `signals` (`primary_entity_id`);
--> statement-breakpoint
CREATE INDEX `signals_type_idx` ON `signals` (`signal_type`);
--> statement-breakpoint
CREATE TABLE `evidence` (
  `id` text PRIMARY KEY NOT NULL,
  `signal_id` text NOT NULL,
  `url` text NOT NULL,
  `source_type` text NOT NULL,
  `excerpt` text,
  `published_at` integer,
  FOREIGN KEY (`signal_id`) REFERENCES `signals`(`id`)
);
--> statement-breakpoint
CREATE INDEX `evidence_signal_idx` ON `evidence` (`signal_id`);
--> statement-breakpoint
CREATE TABLE `score_runs` (
  `id` text PRIMARY KEY NOT NULL,
  `signal_id` text NOT NULL,
  `run_at` integer NOT NULL,
  `window_days` integer NOT NULL,
  `forward_return` real,
  `outcome` text NOT NULL,
  `notes` text,
  FOREIGN KEY (`signal_id`) REFERENCES `signals`(`id`)
);
--> statement-breakpoint
CREATE INDEX `score_runs_signal_idx` ON `score_runs` (`signal_id`);
--> statement-breakpoint
CREATE INDEX `score_runs_run_at_idx` ON `score_runs` (`run_at`);
