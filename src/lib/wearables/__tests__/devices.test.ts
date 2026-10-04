import { describe, expect, it } from "vitest";
import type { WatchDevice } from "@/types/watch";
import {
  autoDeviceFor,
  buildDeviceList,
  describeDevice,
  deviceKindFromFormFactor,
  resolveDeviceSelection,
  sanitizeDeviceSelection,
} from "../devices";
import {
  heartRateWatch,
  PHONE_SOURCE,
  restingDailyString,
  sleepWatch,
  stepsPhone,
  stepsWatch,
  WATCH_SOURCE,
} from "./fixtures";

describe("describeDevice", () => {
  it("uses the uid as id and builds a labelled name for a watch", () => {
    expect(describeDevice(WATCH_SOURCE)).toEqual({
      id: "watch-uid-1",
      kind: "watch",
      label: "Watch · Fitbit Charge 6",
    });
  });

  it("falls back to manufacturer, model and form factor when there is no uid", () => {
    expect(describeDevice(PHONE_SOURCE)).toEqual({
      id: "Google|Pixel 8|PHONE",
      kind: "phone",
      label: "Phone · Google Pixel 8",
    });
  });

  it("does not repeat the manufacturer when the model already starts with it", () => {
    const info = describeDevice({
      device: { formFactor: "WATCH", manufacturer: "Google", model: "Google Pixel Watch 3" },
    });
    expect(info.label).toBe("Watch · Google Pixel Watch 3");
  });

  it("falls back to the application, then to unknown", () => {
    expect(describeDevice({ application: { name: "Health Sync" } })).toEqual({
      id: "Health Sync",
      kind: "other",
      label: "Health Sync",
    });
    expect(describeDevice({ application: { packageName: "com.example.app" } }).id).toBe(
      "com.example.app",
    );
    expect(describeDevice(undefined)).toEqual({
      id: "unknown",
      kind: "other",
      label: "Unknown device",
    });
  });

  it("names devices that have a form factor but no name", () => {
    expect(describeDevice({ device: { formFactor: "WRISTBAND" } }).label).toBe("Unnamed watch");
    expect(describeDevice({ device: { formFactor: "PHONE" } }).label).toBe("Unnamed phone");
  });

  it("maps open form factor strings to a kind", () => {
    for (const f of ["WATCH", "WRISTBAND", "WEARABLE_WRIST", "SMART_RING", "RING", "smartwatch"]) {
      expect(deviceKindFromFormFactor(f)).toBe("watch");
    }
    for (const f of ["PHONE", "TABLET"]) expect(deviceKindFromFormFactor(f)).toBe("phone");
    for (const f of ["CHEST_STRAP", "SCALE", "", undefined]) {
      expect(deviceKindFromFormFactor(f)).toBe("other");
    }
  });
});

describe("buildDeviceList", () => {
  const list = buildDeviceList({
    steps: [
      stepsPhone("2026-09-01T10:00:00Z", "2026-09-01T10:01:00Z", "5"),
      stepsPhone("2026-09-01T11:00:00Z", "2026-09-01T11:01:00Z", "5"),
      stepsWatch("2026-09-01T10:00:00Z", "2026-09-01T10:01:00Z", "5"),
    ],
    heartRate: [
      heartRateWatch("2026-09-01T10:00:00Z", "70"),
      restingDailyString("2026-09-01", "60"),
    ],
    sleep: [
      sleepWatch("2026-09-01T22:00:00Z", "2026-09-02T06:00:00Z", "450", false),
      sleepWatch("2026-09-02T13:00:00Z", "2026-09-02T14:00:00Z", "50", true),
    ],
  });

  it("lists each device once, watch first, with the metrics and counts it has", () => {
    expect(list.map((d) => d.label)).toEqual(["Watch · Fitbit Charge 6", "Phone · Google Pixel 8"]);
    expect(list[0].metrics).toEqual(["steps", "heartRate", "sleep"]);
    expect(list[0].sampleCounts).toEqual({ steps: 1, heartRate: 2, sleep: 1 });
    expect(list[1].metrics).toEqual(["steps"]);
    expect(list[1].sampleCounts).toEqual({ steps: 2 });
  });

  it("keeps two same-named devices apart", () => {
    const twin = { device: { formFactor: "PHONE", model: "Pixel 8", uid: "a" } };
    const twin2 = { device: { formFactor: "PHONE", model: "Pixel 8", uid: "b" } };
    const out = buildDeviceList({
      steps: [
        { ...stepsPhone("2026-09-01T10:00:00Z", "2026-09-01T10:01:00Z", "1"), dataSource: twin },
        { ...stepsPhone("2026-09-01T10:00:00Z", "2026-09-01T10:01:00Z", "1"), dataSource: twin2 },
      ],
    });
    expect(out.map((d) => d.label)).toEqual(["Phone · Pixel 8", "Phone · Pixel 8 (2)"]);
  });

  it("returns an empty list without points", () => {
    expect(buildDeviceList({})).toEqual([]);
  });
});

describe("automatic device choice", () => {
  const device = (
    id: string,
    kind: WatchDevice["kind"],
    steps: number,
    metrics: WatchDevice["metrics"] = ["steps"],
  ): WatchDevice => ({ id, kind, label: id, metrics, sampleCounts: { steps } });

  it("prefers a watch over a phone even when the phone has more records", () => {
    const devices = [device("phone", "phone", 900), device("watch", "watch", 10)];
    expect(autoDeviceFor(devices, "steps")).toBe("watch");
  });

  it("prefers a phone over other devices", () => {
    expect(autoDeviceFor([device("x", "other", 5), device("phone", "phone", 1)], "steps")).toBe(
      "phone",
    );
  });

  it("breaks a tie by the most records", () => {
    expect(autoDeviceFor([device("w1", "watch", 3), device("w2", "watch", 8)], "steps")).toBe("w2");
  });

  it("only considers devices that have the metric", () => {
    const devices = [device("watch", "watch", 10, ["heartRate"]), device("phone", "phone", 1)];
    expect(autoDeviceFor(devices, "steps")).toBe("phone");
    expect(autoDeviceFor(devices, "sleep")).toBeNull();
  });

  it("uses a saved choice when valid and falls back to automatic when it is gone", () => {
    const devices = [device("phone", "phone", 900), device("watch", "watch", 10)];
    expect(
      resolveDeviceSelection(devices, { steps: "phone", heartRate: null, sleep: null }).steps,
    ).toBe("phone");
    const stale = { steps: "old-device", heartRate: "phone", sleep: null };
    expect(resolveDeviceSelection(devices, stale).steps).toBe("watch");
    // "phone" has no heart rate in this list, so the saved choice is not valid for it
    expect(resolveDeviceSelection(devices, stale).heartRate).toBeNull();
    expect(sanitizeDeviceSelection(devices, stale)).toEqual({
      steps: null,
      heartRate: null,
      sleep: null,
    });
  });
});
