import { describe, expect, it } from "vitest";
import { describeMetricStatus, describeSyncStatus } from "../metricStatusText";

describe("describeMetricStatus", () => {
  it("counts readings", () => {
    expect(describeMetricStatus("heartRate", { status: "ok", count: 812 })).toBe(
      "Heart rate: 812 readings",
    );
    expect(describeMetricStatus("sleep", { status: "ok", count: 1 })).toBe("Sleep: 1 night");
  });

  it("says when there is no data yet", () => {
    expect(describeMetricStatus("steps", { status: "ok", count: 0 })).toBe(
      "Steps: No watch data yet",
    );
  });

  it("quotes what Google said", () => {
    expect(
      describeMetricStatus("heartRate", {
        status: "http-error",
        httpStatus: 400,
        reason: "INVALID_FILTER_FIELD",
        message: "Invalid filter",
      }),
    ).toBe("Heart rate: could not be read (Google said: INVALID_FILTER_FIELD)");
    expect(describeMetricStatus("steps", { status: "http-error", httpStatus: 500 })).toBe(
      "Steps: could not be read (error 500)",
    );
    expect(describeMetricStatus("sleep", { status: "network-error", message: "x" })).toBe(
      "Sleep: could not be read (no connection)",
    );
  });
});

describe("describeSyncStatus", () => {
  it("hides the daily resting heart rate unless it failed", () => {
    const ok = describeSyncStatus({
      steps: { status: "ok", count: 3 },
      restingHrDaily: { status: "ok", count: 5 },
    });
    expect(ok.map((l) => l.key)).toEqual(["steps"]);
    const bad = describeSyncStatus({ restingHrDaily: { status: "invalid-response" } });
    expect(bad[0].text).toBe("Resting heart rate: could not be read (unexpected answer)");
  });
});
