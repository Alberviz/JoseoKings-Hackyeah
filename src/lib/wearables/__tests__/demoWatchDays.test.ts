import { describe, expect, it } from "vitest";
import { buildDemoWatchDays } from "../demoWatchDays";
import { watchStateSchema } from "@/lib/storage/watchStore";

describe("buildDemoWatchDays", () => {
  const days = buildDemoWatchDays(new Date(2026, 9, 4, 12));

  it("makes 28 consecutive local days ending today, oldest first", () => {
    expect(days).toHaveLength(28);
    expect(days[0].date).toBe("2026-09-07");
    expect(days[27].date).toBe("2026-10-04");
  });

  it("fits the stored shape", () => {
    expect(watchStateSchema.safeParse({ days, lastSyncAt: null, isDemo: true }).success).toBe(true);
  });

  it("is deterministic", () => {
    expect(buildDemoWatchDays(new Date(2026, 9, 4, 20))).toEqual(days);
  });
});
