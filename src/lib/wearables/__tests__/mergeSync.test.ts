import { describe, expect, it } from "vitest";
import type { WearableDay, WearableDevice } from "@/types/wearable";
import {
  failedMetrics,
  mergeDevices,
  mergeRawSamples,
  mergeSyncedDays,
  partialMetrics,
} from "../mergeSync";
import type { WearableSample } from "../types";

const day = (over: Partial<WearableDay> = {}): WearableDay => ({
  date: "2026-09-01",
  steps: null,
  restingHr: null,
  sleepMinutes: null,
  nightComplete: false,
  dayComplete: false,
  ...over,
});

describe("failedMetrics and partialMetrics", () => {
  it("tell failed metrics from partly read ones", () => {
    const status = {
      steps: { status: "http-error", httpStatus: 403 },
      heartRate: { status: "ok", count: 10, partial: true },
      sleep: { status: "ok", count: 1 },
    } as const;
    expect([...failedMetrics(status)]).toEqual(["steps"]);
    expect([...partialMetrics(status)]).toEqual(["heartRate"]);
  });
});

describe("mergeSyncedDays", () => {
  it("keeps the saved steps when steps failed and overwrites what was read", () => {
    const stored = [day({ steps: 8000, sleepMinutes: 400 })];
    const incoming = [day({ steps: null, sleepMinutes: 480 })];
    const [merged] = mergeSyncedDays(stored, incoming, new Set(["steps"]));
    expect(merged.steps).toBe(8000);
    expect(merged.sleepMinutes).toBe(480);
  });

  it("keeps the saved sleep and night figures when sleep failed", () => {
    const stored = [
      day({
        sleepMinutes: 450,
        restingHr: 60,
        restingHrSource: "night-samples",
        nightComplete: true,
      }),
    ];
    const incoming = [day({ steps: 5000 })];
    const [merged] = mergeSyncedDays(stored, incoming, new Set(["sleep"]));
    expect(merged).toMatchObject({
      steps: 5000,
      sleepMinutes: 450,
      restingHr: 60,
      restingHrSource: "night-samples",
      nightComplete: true,
    });
  });

  it("uses the new day as it is when nothing was saved or nothing failed", () => {
    const incoming = [day({ steps: 100 })];
    expect(mergeSyncedDays([], incoming, new Set(["steps"]))).toEqual(incoming);
    expect(mergeSyncedDays([day({ steps: 999 })], incoming, new Set())).toEqual(incoming);
  });

  it("marks days built from a partly read metric as not complete", () => {
    const incoming = [day({ steps: 100, dayComplete: true, nightComplete: true })];
    const [merged] = mergeSyncedDays([], incoming, new Set(), new Set(["heartRate"]));
    expect(merged.dayComplete).toBe(false);
    expect(merged.nightComplete).toBe(false);
    const [stepsOnly] = mergeSyncedDays([], incoming, new Set(), new Set(["steps"]));
    expect(stepsOnly.dayComplete).toBe(false);
    expect(stepsOnly.nightComplete).toBe(true);
  });
});

describe("mergeRawSamples", () => {
  const sample = (metric: WearableSample["metric"], value: number): WearableSample => ({
    metric,
    startAt: "2026-09-01T10:00:00Z",
    endAt: "2026-09-01T10:01:00Z",
    value,
    source: "a",
  });

  it("keeps saved samples only for the metrics that failed", () => {
    const stored = [sample("steps", 1), sample("heartRate", 2), sample("sleepSession", 3)];
    const incoming = [sample("heartRate", 20)];
    const merged = mergeRawSamples(stored, incoming, new Set(["steps"]));
    expect(merged.map((s) => [s.metric, s.value])).toEqual([
      ["steps", 1],
      ["heartRate", 20],
    ]);
  });

  it("replaces everything when nothing failed", () => {
    const incoming = [sample("steps", 5)];
    expect(mergeRawSamples([sample("steps", 1)], incoming, new Set())).toEqual(incoming);
  });
});

describe("mergeDevices", () => {
  const device = (id: string, metrics: WearableDevice["metrics"]): WearableDevice => ({
    id,
    kind: "wearable",
    label: id,
    metrics,
    sampleCounts: Object.fromEntries(metrics.map((m) => [m, 3])),
  });

  it("brings back the saved device for a metric that failed", () => {
    const merged = mergeDevices(
      [device("band", ["steps", "sleep"])],
      [device("band", ["sleep"])],
      new Set(["steps"]),
    );
    expect(merged).toHaveLength(1);
    expect([...merged[0].metrics].sort()).toEqual(["sleep", "steps"]);
    expect(merged[0].sampleCounts).toEqual({ sleep: 3, steps: 3 });
  });
});
