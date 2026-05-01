-- Product workflow persistence extracted from Mentionpilot and AgentMode.
-- These tables keep the useful legacy objects under High Signal ownership
-- boundaries instead of preserving the old app/project route graph.

CREATE TABLE `mention_brand_configs` (
  `id` text PRIMARY KEY NOT NULL,
  `owner_id` text NOT NULL,
  `brand_name` text NOT NULL,
  `brand_aliases` text DEFAULT '[]' NOT NULL,
  `brand_url` text,
  `competitors` text DEFAULT '[]' NOT NULL,
  `platforms` text DEFAULT '[]' NOT NULL,
  `ai_endpoint_url` text,
  `ai_model` text,
  `check_schedule` text,
  `last_scheduled_check` integer,
  `badge_enabled` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `mention_brand_configs_owner_idx` ON `mention_brand_configs` (`owner_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `mention_brand_configs_owner_brand_idx` ON `mention_brand_configs` (`owner_id`, `brand_name`);
--> statement-breakpoint

CREATE TABLE `mention_prompts` (
  `id` text PRIMARY KEY NOT NULL,
  `config_id` text NOT NULL,
  `owner_id` text NOT NULL,
  `prompt_text` text NOT NULL,
  `category` text,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`config_id`) REFERENCES `mention_brand_configs`(`id`)
);
--> statement-breakpoint
CREATE INDEX `mention_prompts_config_idx` ON `mention_prompts` (`config_id`);
--> statement-breakpoint
CREATE INDEX `mention_prompts_owner_idx` ON `mention_prompts` (`owner_id`);
--> statement-breakpoint

CREATE TABLE `mention_checks` (
  `id` text PRIMARY KEY NOT NULL,
  `config_id` text NOT NULL,
  `owner_id` text NOT NULL,
  `status` text DEFAULT 'running' NOT NULL,
  `total_queries` integer DEFAULT 0 NOT NULL,
  `completed_queries` integer DEFAULT 0 NOT NULL,
  `brand_mention_rate` real,
  `summary` text,
  `created_at` integer NOT NULL,
  `completed_at` integer,
  FOREIGN KEY (`config_id`) REFERENCES `mention_brand_configs`(`id`)
);
--> statement-breakpoint
CREATE INDEX `mention_checks_config_idx` ON `mention_checks` (`config_id`);
--> statement-breakpoint
CREATE INDEX `mention_checks_owner_created_idx` ON `mention_checks` (`owner_id`, `created_at`);
--> statement-breakpoint

CREATE TABLE `mention_results` (
  `id` text PRIMARY KEY NOT NULL,
  `check_id` text NOT NULL,
  `config_id` text NOT NULL,
  `owner_id` text NOT NULL,
  `prompt_id` text NOT NULL,
  `platform` text NOT NULL,
  `model` text NOT NULL,
  `response_text` text NOT NULL,
  `brand_mentioned` integer DEFAULT 0 NOT NULL,
  `brand_sentiment` text,
  `brand_position` integer,
  `competitors_mentioned` text DEFAULT '[]' NOT NULL,
  `citations` text DEFAULT '[]' NOT NULL,
  `brand_cited` integer DEFAULT 0 NOT NULL,
  `latency_ms` integer,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`check_id`) REFERENCES `mention_checks`(`id`),
  FOREIGN KEY (`config_id`) REFERENCES `mention_brand_configs`(`id`)
);
--> statement-breakpoint
CREATE INDEX `mention_results_check_idx` ON `mention_results` (`check_id`);
--> statement-breakpoint
CREATE INDEX `mention_results_config_idx` ON `mention_results` (`config_id`);
--> statement-breakpoint

CREATE TABLE `tracked_communities` (
  `id` text PRIMARY KEY NOT NULL,
  `owner_id` text NOT NULL,
  `subreddit` text NOT NULL,
  `prompt` text,
  `period` text DEFAULT 'week' NOT NULL,
  `is_public` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tracked_communities_owner_idx` ON `tracked_communities` (`owner_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `tracked_communities_owner_subreddit_period_idx` ON `tracked_communities` (`owner_id`, `subreddit`, `period`);
--> statement-breakpoint

CREATE TABLE `community_digest_snapshots` (
  `id` text PRIMARY KEY NOT NULL,
  `tracked_community_id` text,
  `owner_id` text NOT NULL,
  `subreddit` text NOT NULL,
  `period` text NOT NULL,
  `snapshot_date` integer NOT NULL,
  `summary_text` text NOT NULL,
  `summary` text,
  `prompt_used` text NOT NULL,
  `source_count` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`tracked_community_id`) REFERENCES `tracked_communities`(`id`)
);
--> statement-breakpoint
CREATE INDEX `community_digest_snapshots_track_idx` ON `community_digest_snapshots` (`tracked_community_id`);
--> statement-breakpoint
CREATE INDEX `community_digest_snapshots_owner_idx` ON `community_digest_snapshots` (`owner_id`);
--> statement-breakpoint
CREATE INDEX `community_digest_snapshots_subreddit_period_idx` ON `community_digest_snapshots` (`subreddit`, `period`);
