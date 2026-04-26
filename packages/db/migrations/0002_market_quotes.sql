-- Prediction-market quote time-series. One row per (source, marketId, fetchedAt-bucket).
-- Lets us track how Polymarket / Manifold / Kalshi consensus evolves around AI-infra entities.

CREATE TABLE `market_quotes` (
  `id` text PRIMARY KEY NOT NULL,
  `source` text NOT NULL,
  `market_id` text NOT NULL,
  `entity_id` text,
  `question` text NOT NULL,
  `outcome` text NOT NULL,
  `prob` real NOT NULL,
  `volume` real,
  `resolved` integer DEFAULT 0 NOT NULL,
  `resolved_outcome` text,
  `fetched_at` integer NOT NULL,
  `market_url` text NOT NULL,
  FOREIGN KEY (`entity_id`) REFERENCES `entities`(`id`)
);
--> statement-breakpoint
CREATE INDEX `market_quotes_entity_idx` ON `market_quotes` (`entity_id`);
--> statement-breakpoint
CREATE INDEX `market_quotes_source_market_idx` ON `market_quotes` (`source`, `market_id`);
--> statement-breakpoint
CREATE INDEX `market_quotes_fetched_idx` ON `market_quotes` (`fetched_at`);
