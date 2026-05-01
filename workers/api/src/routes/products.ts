import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "../db";
import { normalizeCommunitySummary } from "@high-signal/shared";
import type {
  AIPlatform,
  CommunityDigestSnapshot,
  MentionBrandConfig,
  MentionCheck,
  MentionPrompt,
  ProductDashboardSnapshot,
  TrackedCommunity,
} from "@high-signal/shared";

type Env = { DB: D1Database };

export const productsRoute = new Hono<{ Bindings: Env }>();

productsRoute.get("/dashboard", async (c) => {
  const ownerId = c.req.query("owner")?.trim();
  if (!ownerId) return c.json({ error: "missing_owner" }, 400);

  const database = db(c.env.DB);
  const [configs, prompts, recentChecks, tracked, latestDigests] = await Promise.all([
    database
      .select()
      .from(schema.mentionBrandConfigs)
      .where(eq(schema.mentionBrandConfigs.ownerId, ownerId))
      .orderBy(desc(schema.mentionBrandConfigs.updatedAt))
      .limit(10),
    database
      .select()
      .from(schema.mentionPrompts)
      .where(eq(schema.mentionPrompts.ownerId, ownerId))
      .orderBy(desc(schema.mentionPrompts.createdAt))
      .limit(50),
    database
      .select()
      .from(schema.mentionChecks)
      .where(eq(schema.mentionChecks.ownerId, ownerId))
      .orderBy(desc(schema.mentionChecks.createdAt))
      .limit(10),
    database
      .select()
      .from(schema.trackedCommunities)
      .where(eq(schema.trackedCommunities.ownerId, ownerId))
      .orderBy(desc(schema.trackedCommunities.updatedAt))
      .limit(25),
    database
      .select()
      .from(schema.communityDigestSnapshots)
      .where(eq(schema.communityDigestSnapshots.ownerId, ownerId))
      .orderBy(desc(schema.communityDigestSnapshots.snapshotDate))
      .limit(10),
  ]);

  return c.json(
    productDashboardSnapshot({
      ownerId,
      configs,
      prompts,
      recentChecks,
      tracked,
      latestDigests,
    }),
  );
});

export function productDashboardSnapshot(input: {
  ownerId: string;
  configs: Array<typeof schema.mentionBrandConfigs.$inferSelect>;
  prompts: Array<typeof schema.mentionPrompts.$inferSelect>;
  recentChecks: Array<typeof schema.mentionChecks.$inferSelect>;
  tracked: Array<typeof schema.trackedCommunities.$inferSelect>;
  latestDigests: Array<typeof schema.communityDigestSnapshots.$inferSelect>;
}): ProductDashboardSnapshot {
  return {
    ownerId: input.ownerId,
    mentions: {
      configs: input.configs.map(toMentionBrandConfig),
      prompts: input.prompts.map(toMentionPrompt),
      recentChecks: input.recentChecks.map(toMentionCheck),
    },
    communities: {
      tracked: input.tracked.map(toTrackedCommunity),
      latestDigests: input.latestDigests.map(toCommunityDigestSnapshot),
    },
  };
}

function toMentionBrandConfig(
  row: typeof schema.mentionBrandConfigs.$inferSelect,
): MentionBrandConfig {
  return {
    id: row.id,
    companyId: row.ownerId,
    brandName: row.brandName,
    brandAliases: stringArray(row.brandAliases),
    brandUrl: row.brandUrl,
    competitors: objectArray<{ name: string; url?: string }>(row.competitors).filter((item) =>
      Boolean(item.name),
    ),
    platforms: stringArray(row.platforms).filter(isAIPlatform),
    aiEndpointUrl: row.aiEndpointUrl,
    aiModel: row.aiModel,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toMentionPrompt(row: typeof schema.mentionPrompts.$inferSelect): MentionPrompt {
  return {
    id: row.id,
    companyId: row.ownerId,
    promptText: row.promptText,
    category: row.category,
    createdAt: row.createdAt.toISOString(),
  };
}

function toMentionCheck(row: typeof schema.mentionChecks.$inferSelect): MentionCheck {
  return {
    id: row.id,
    companyId: row.ownerId,
    status: row.status,
    totalQueries: row.totalQueries,
    completedQueries: row.completedQueries,
    brandMentionRate: row.brandMentionRate,
    summary: row.summary,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

function toTrackedCommunity(row: typeof schema.trackedCommunities.$inferSelect): TrackedCommunity {
  return {
    id: row.id,
    ownerId: row.ownerId,
    subreddit: row.subreddit,
    prompt: row.prompt,
    period: row.period,
    isPublic: row.isPublic,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toCommunityDigestSnapshot(
  row: typeof schema.communityDigestSnapshots.$inferSelect,
): CommunityDigestSnapshot {
  return {
    id: row.id,
    subreddit: row.subreddit,
    period: row.period,
    snapshotDate: row.snapshotDate.toISOString(),
    summaryText: row.summaryText,
    summary: normalizeCommunitySummary(row.summary),
    promptUsed: row.promptUsed,
    sourceCount: row.sourceCount,
    createdAt: row.createdAt.toISOString(),
  };
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return [];
}

function objectArray<T extends Record<string, unknown>>(value: unknown): T[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is T => Boolean(item) && typeof item === "object");
}

function isAIPlatform(value: string): value is AIPlatform {
  return ["openai", "anthropic", "google", "perplexity", "custom"].includes(value);
}
