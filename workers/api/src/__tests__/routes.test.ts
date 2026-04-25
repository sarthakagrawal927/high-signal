import { describe, it, expect } from "vitest";
import app from "../index";

const fetcher = app as unknown as { fetch: typeof fetch };

describe("worker routes", () => {
  it("/health returns ok", async () => {
    const res = await fetcher.fetch(new Request("http://t/health"));
    expect(res.status).toBe(200);
    const j = (await res.json()) as { ok: boolean };
    expect(j.ok).toBe(true);
  });

  it("/ returns metadata", async () => {
    const res = await fetcher.fetch(new Request("http://t/"));
    expect(res.status).toBe(200);
    const j = (await res.json()) as { name: string };
    expect(j.name).toBe("high-signal-api");
  });
});
