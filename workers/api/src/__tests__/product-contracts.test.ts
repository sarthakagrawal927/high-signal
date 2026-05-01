import { describe, expect, it } from "vitest";
import { normalizeCommunitySummary, redditSourceLink } from "@high-signal/shared";
import { analyzeMentionResponse } from "../lib/mention-execution";
import { productDashboardSnapshot } from "../routes/products";

describe("product workflow contracts", () => {
  it("normalizes AgentMode source-linked summaries", () => {
    const summary = normalizeCommunitySummary({
      key_trend: {
        title: "Operators want source links",
        desc: "Digest consumers need provenance before acting.",
        sourceId: ["abc123", "def456"],
      },
      notable_discussions: [{ title: "Budget controls", desc: "Teams ask for spend caps." }],
    });

    expect(summary?.keyTrend?.title).toBe("Operators want source links");
    expect(summary?.notableDiscussions).toHaveLength(1);
    expect(redditSourceLink("LocalLLaMA", summary?.keyTrend?.sourceId)).toBe(
      "https://www.reddit.com/r/LocalLLaMA/comments/abc123/comment/def456",
    );
  });

  it("maps persisted Mentionpilot and AgentMode rows to High Signal dashboard contracts", () => {
    const now = new Date("2026-05-01T00:00:00.000Z");
    const dashboard = productDashboardSnapshot({
      ownerId: "user_123",
      configs: [
        {
          id: "cfg_1",
          ownerId: "user_123",
          brandName: "High Signal",
          brandAliases: ["HighSignal"],
          brandUrl: "https://highsignal.test",
          competitors: [{ name: "Brandwatch" }],
          platforms: ["openai", "perplexity"],
          aiEndpointUrl: null,
          aiModel: "multi-model",
          checkSchedule: "weekly",
          lastScheduledCheck: null,
          badgeEnabled: true,
          createdAt: now,
          updatedAt: now,
        },
      ],
      prompts: [
        {
          id: "prompt_1",
          configId: "cfg_1",
          ownerId: "user_123",
          promptText: "Which AI visibility tools should I compare?",
          category: "competitors",
          createdAt: now,
        },
      ],
      recentChecks: [
        {
          id: "check_1",
          configId: "cfg_1",
          ownerId: "user_123",
          status: "completed",
          totalQueries: 1,
          completedQueries: 1,
          brandMentionRate: 1,
          summary: "Mentioned once.",
          createdAt: now,
          completedAt: now,
        },
      ],
      tracked: [
        {
          id: "track_1",
          ownerId: "user_123",
          subreddit: "LocalLLaMA",
          prompt: "Find agent operations pain.",
          period: "week",
          isPublic: false,
          createdAt: now,
          updatedAt: now,
        },
      ],
      latestDigests: [
        {
          id: "digest_1",
          trackedCommunityId: "track_1",
          ownerId: "user_123",
          subreddit: "LocalLLaMA",
          period: "week",
          snapshotDate: now,
          summaryText: "Operators want provenance.",
          summary: {
            key_trend: { title: "Provenance", desc: "Source links matter.", sourceId: ["abc123"] },
          },
          promptUsed: "Find agent operations pain.",
          sourceCount: 12,
          createdAt: now,
        },
      ],
    });

    expect(dashboard.mentions.configs[0]?.brandName).toBe("High Signal");
    expect(dashboard.mentions.prompts[0]?.promptText).toContain("AI visibility");
    expect(dashboard.mentions.recentChecks[0]?.status).toBe("completed");
    expect(dashboard.communities.tracked[0]?.subreddit).toBe("LocalLLaMA");
    expect(dashboard.communities.latestDigests[0]?.summary?.keyTrend?.title).toBe("Provenance");
  });

  it("preserves Mentionpilot brand visibility analysis semantics", () => {
    const result = analyzeMentionResponse({
      text: [
        "1. Competitor Cloud is reliable.",
        "2. High Signal is a recommended monitoring product.",
        "Read more at https://highsignal.test/case-study.",
      ].join("\n"),
      brandName: "High Signal",
      brandAliases: ["HighSignal"],
      brandUrl: "https://highsignal.test",
      competitors: [{ name: "Competitor Cloud" }],
    });

    expect(result.brandMentioned).toBe(true);
    expect(result.brandSentiment).toBe("positive");
    expect(result.brandPosition).toBe(2);
    expect(result.brandCited).toBe(true);
    expect(result.competitorsMentioned[0]).toMatchObject({
      name: "Competitor Cloud",
      mentioned: true,
      position: 1,
    });
  });
});
