import { describe, expect, it } from "vitest";
import type { WearableDevice } from "@/types/wearable";
import {
  autoDeviceFor,
  buildDeviceList,
  describeDevice,
  deviceKindFromFormFactor,
  resolveDeviceSelection,
  sanitizeDeviceSelection,
} from "../devices";
import {
  HC_PHONE_SOURCE,
  heartRateFrom,
  heartRateWearable,
  PHONE_SOURCE,
  restingDailyString,
  sleepFrom,
  sleepWearable,
  stepsFrom,
  stepsPhone,
  stepsWearable,
  WEARABLE_SOURCE,
  ZEPP_BAND_SOURCE,
  ZEPP_EMPTY_DEVICE_SOURCE,
} from "./fixtures";

describe("describeDevice", () => {
  it("uses the uid as id and builds a labelled name for a wearable", () => {
    expect(describeDevice(WEARABLE_SOURCE)).toEqual({
      id: "com.fitbit.FitbitMobile|wearable-uid-1",
      kind: "wearable",
      label: "Wearable · Fitbit Charge 6",
    });
  });

  it("uses the source app as id, with the uid only when there is one", () => {
    expect(describeDevice(PHONE_SOURCE)).toEqual({
      id: "com.google.android.apps.fitness",
      kind: "phone",
      label: "Phone · Google Pixel 8",
    });
  });

  it("falls back to uid, then manufacturer, model and form factor without a package name", () => {
    expect(describeDevice({ device: { uid: "abc", formFactor: "WATCH" } }).id).toBe("abc");
    expect(describeDevice({ device: { manufacturer: "Acme", formFactor: "PHONE" } }).id).toBe(
      "Acme|PHONE",
    );
    expect(describeDevice({ device: { model: "X1" } }).id).toBe("X1");
  });

  it("never builds an id with an empty segment", () => {
    for (const source of [
      { device: { formFactor: "FITNESS_BAND" } },
      { device: {} },
      { device: { manufacturer: " ", model: "" } },
      undefined,
    ]) {
      expect(describeDevice(source).id).not.toMatch(/(^\|)|(\|\|)|(\|$)/);
    }
    expect(describeDevice({ device: {} }).id).toBe("unknown");
  });

  it("does not repeat the manufacturer when the model already starts with it", () => {
    const info = describeDevice({
      device: { formFactor: "WATCH", manufacturer: "Google", model: "Google Pixel Watch 3" },
    });
    expect(info.label).toBe("Wearable · Google Pixel Watch 3");
  });

  it("keeps the wearable and the phone of the same app apart so steps are not summed", () => {
    const phoneSide = { ...ZEPP_BAND_SOURCE, device: { formFactor: "PHONE" } };
    const wearable = describeDevice(ZEPP_BAND_SOURCE);
    const phone = describeDevice(phoneSide);
    expect(wearable.id).toBe("com.huami.watch.hmwatchmanager");
    expect(phone.id).toBe("com.huami.watch.hmwatchmanager|phone");
    expect(phone.kind).toBe("phone");
  });

  it("keeps a nap out of the device list unless the app flags it as main sleep", () => {
    const nap = (mainSleep: boolean) => ({
      ...sleepFrom(ZEPP_BAND_SOURCE, "2026-09-01T13:00:00Z", "2026-09-01T14:00:00Z", "50"),
      sleep: {
        interval: { startTime: "2026-09-01T13:00:00Z", endTime: "2026-09-01T14:00:00Z" },
        metadata: { nap: true, mainSleep },
      },
    });
    expect(buildDeviceList({ sleep: [nap(false)] })).toEqual([]);
    expect(buildDeviceList({ sleep: [nap(true)] })).toHaveLength(1);
  });

  it("falls back to the application, then to unknown", () => {
    expect(describeDevice({ application: { name: "Health Sync" } })).toEqual({
      id: "Health Sync",
      kind: "other",
      label: "Health Sync",
    });
    // Unknown package: the last dotted segment, only as a last resort.
    expect(describeDevice({ application: { packageName: "com.example.hmwatchmanager" } })).toEqual({
      id: "com.example.hmwatchmanager",
      kind: "other",
      label: "Hmwatchmanager",
    });
    expect(describeDevice(undefined)).toEqual({
      id: "unknown",
      kind: "other",
      label: "Unknown device",
    });
  });

  it("names devices that have a form factor but no name", () => {
    expect(describeDevice({ device: { formFactor: "WRISTBAND" } }).label).toBe("Unnamed wearable");
    expect(describeDevice({ device: { formFactor: "PHONE" } }).label).toBe("This phone");
  });

  it("knows the common source apps and never shows a raw package name for them", () => {
    expect(describeDevice(ZEPP_EMPTY_DEVICE_SOURCE)).toEqual({
      id: "com.huami.watch.hmwatchmanager",
      kind: "wearable",
      label: "Wearable · Zepp (Amazfit)",
    });
    expect(
      describeDevice({ application: { packageName: "com.garmin.android.apps.connectmobile" } }),
    ).toMatchObject({ kind: "wearable", label: "Wearable · Garmin Connect" });
    expect(
      describeDevice({ application: { packageName: "com.google.android.apps.fitness" } }),
    ).toMatchObject({ kind: "other", label: "Google Fit" });
    expect(
      describeDevice({ application: { packageName: "com.android.healthconnect.phone.x" } }),
    ).toMatchObject({ kind: "phone", label: "This phone" });
  });

  it("maps open form factor strings to a kind", () => {
    for (const f of ["WATCH", "WRISTBAND", "WEARABLE_WRIST", "SMART_RING", "RING", "smartwatch"]) {
      expect(deviceKindFromFormFactor(f)).toBe("wearable");
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
      stepsWearable("2026-09-01T10:00:00Z", "2026-09-01T10:01:00Z", "5"),
    ],
    heartRate: [
      heartRateWearable("2026-09-01T10:00:00Z", "70"),
      restingDailyString("2026-09-01", "60"),
    ],
    sleep: [
      sleepWearable("2026-09-01T22:00:00Z", "2026-09-02T06:00:00Z", "450", false),
      sleepWearable("2026-09-02T13:00:00Z", "2026-09-02T14:00:00Z", "50", true),
    ],
  });

  it("lists each device once, wearable first, with the metrics and counts it has", () => {
    expect(list.map((d) => d.label)).toEqual([
      "Wearable · Fitbit Charge 6",
      "Phone · Google Pixel 8",
    ]);
    expect(list.map((d) => d.id)).toEqual([
      "com.fitbit.FitbitMobile|wearable-uid-1",
      "com.google.android.apps.fitness",
    ]);
    expect(list[0].metrics).toEqual(["steps", "heartRate", "sleep"]);
    expect(list[0].sampleCounts).toEqual({ steps: 1, heartRate: 2, sleep: 1 });
    expect(list[1].metrics).toEqual(["steps"]);
    expect(list[1].sampleCounts).toEqual({ steps: 2 });
  });

  it("keeps two same-named devices apart", () => {
    const twin = { device: { formFactor: "PHONE", model: "Pixel 8", uid: "a" } };
    const twin2 = { device: { formFactor: "PHONE", model: "Pixel 8", uid: "b" } };
    expect(describeDevice(twin).id).not.toBe(describeDevice(twin2).id);
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
    kind: WearableDevice["kind"],
    steps: number,
    metrics: WearableDevice["metrics"] = ["steps"],
  ): WearableDevice => ({ id, kind, label: id, metrics, sampleCounts: { steps } });

  it("prefers a wearable over a phone even when the phone has more records", () => {
    const devices = [device("phone", "phone", 900), device("wearable", "wearable", 10)];
    expect(autoDeviceFor(devices, "steps")).toBe("wearable");
  });

  it("prefers a phone over other devices", () => {
    expect(autoDeviceFor([device("x", "other", 5), device("phone", "phone", 1)], "steps")).toBe(
      "phone",
    );
  });

  it("breaks a tie by the most records", () => {
    expect(autoDeviceFor([device("w1", "wearable", 3), device("w2", "wearable", 8)], "steps")).toBe(
      "w2",
    );
  });

  it("only considers devices that have the metric", () => {
    const devices = [
      device("wearable", "wearable", 10, ["heartRate"]),
      device("phone", "phone", 1),
    ];
    expect(autoDeviceFor(devices, "steps")).toBe("phone");
    expect(autoDeviceFor(devices, "sleep")).toBeNull();
  });

  it("uses a saved choice when valid and falls back to automatic when it is gone", () => {
    const devices = [device("phone", "phone", 900), device("wearable", "wearable", 10)];
    expect(
      resolveDeviceSelection(devices, { steps: "phone", heartRate: null, sleep: null }).steps,
    ).toBe("phone");
    const stale = { steps: "old-device", heartRate: "phone", sleep: null };
    expect(resolveDeviceSelection(devices, stale).steps).toBe("wearable");
    // "phone" has no heart rate in this list, so the saved choice is not valid for it
    expect(resolveDeviceSelection(devices, stale).heartRate).toBeNull();
    expect(sanitizeDeviceSelection(devices, stale)).toEqual({
      steps: null,
      heartRate: null,
      sleep: null,
    });
  });
});

describe("one Zepp wearable seen through Health Connect", () => {
  // Shapes of a live capture, with synthetic numbers: the wearable app sends points with an empty
  // device object, others with only FITNESS_BAND, and the phone app has a hashed package name.
  const T = "2026-09-01T";
  const points = {
    steps: [
      stepsFrom(ZEPP_EMPTY_DEVICE_SOURCE, `${T}08:00:00Z`, `${T}08:01:00Z`, "30"),
      stepsFrom(ZEPP_EMPTY_DEVICE_SOURCE, `${T}09:00:00Z`, `${T}09:01:00Z`, "40"),
      stepsFrom(ZEPP_EMPTY_DEVICE_SOURCE, `${T}10:00:00Z`, `${T}10:01:00Z`, "50"),
      stepsFrom(HC_PHONE_SOURCE, `${T}11:00:00Z`, `${T}11:01:00Z`, "5"),
    ],
    heartRate: [
      heartRateFrom(ZEPP_EMPTY_DEVICE_SOURCE, `${T}08:00:00Z`, "70"),
      heartRateFrom(ZEPP_EMPTY_DEVICE_SOURCE, `${T}08:05:00Z`, "72"),
      heartRateFrom(ZEPP_EMPTY_DEVICE_SOURCE, `${T}08:10:00Z`, "71"),
      heartRateFrom(ZEPP_BAND_SOURCE, `${T}09:00:00Z`, "65"),
    ],
    sleep: [sleepFrom(ZEPP_BAND_SOURCE, "2026-08-31T22:00:00Z", `${T}06:00:00Z`, "450")],
  };
  const list = buildDeviceList(points);

  it("lists exactly two devices: the wearable app and the phone", () => {
    expect(list).toHaveLength(2);
    expect(list.map((d) => d.label)).toEqual(["Wearable · Zepp (Amazfit)", "Phone · Xiaomi"]);
    expect(list.every((d) => !/(^\|)|(\|\|)|(\|$)/.test(d.id))).toBe(true);
  });

  it("merges the empty-device and the FITNESS_BAND points into one wearable", () => {
    const zepp = list[0];
    expect(zepp.id).toBe("com.huami.watch.hmwatchmanager");
    expect(zepp.kind).toBe("wearable");
    expect(zepp.metrics).toEqual(["steps", "heartRate", "sleep"]);
    expect(zepp.sampleCounts).toEqual({ steps: 3, heartRate: 4, sleep: 1 });
    expect(list[1].kind).toBe("phone");
    expect(list[1].metrics).toEqual(["steps"]);
  });

  it("picks the Zepp wearable automatically for steps, heart rate and sleep", () => {
    expect(resolveDeviceSelection(list)).toEqual({
      steps: "com.huami.watch.hmwatchmanager",
      heartRate: "com.huami.watch.hmwatchmanager",
      sleep: "com.huami.watch.hmwatchmanager",
    });
  });

  it("uses the same id as the sample source, so all heart rate points stay together", () => {
    const ids = new Set(points.heartRate.map((p) => describeDevice(p.dataSource).id));
    expect(ids).toEqual(new Set(["com.huami.watch.hmwatchmanager"]));
  });

  it("drops a saved selection made with an old-style id and goes back to automatic", () => {
    const old = {
      steps: "com.huami.watch.hmwatchmanager",
      heartRate: "||FITNESS_BAND",
      sleep: "Xiaomi||PHONE",
    };
    expect(sanitizeDeviceSelection(list, old)).toEqual({
      steps: "com.huami.watch.hmwatchmanager",
      heartRate: null,
      sleep: null,
    });
    const resolved = resolveDeviceSelection(list, old);
    expect(resolved.heartRate).toBe("com.huami.watch.hmwatchmanager");
    expect(resolved.sleep).toBe("com.huami.watch.hmwatchmanager");
  });
});
