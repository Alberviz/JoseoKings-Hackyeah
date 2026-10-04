// Devices that send data to Google Health, and which of them feeds each metric.
// Pure functions: no React, no storage. The id of a device is used as WearableSample.source.
import type {
  DeviceMetric,
  DeviceSelection,
  WearableDevice,
  WearableDeviceKind,
} from "@/types/wearable";
import type { HealthDataPoint, HealthDataSource } from "./googleHealthV4";

export const DEVICE_METRICS: readonly DeviceMetric[] = ["steps", "heartRate", "sleep"];

export const AUTOMATIC_SELECTION: DeviceSelection = { steps: null, heartRate: null, sleep: null };

export type DeviceInfo = { id: string; kind: WearableDeviceKind; label: string };

const UNKNOWN_ID = "unknown";
const PHONE_APP_PREFIX = "com.android.healthconnect.phone";
const THIS_PHONE = "This phone";

/**
 * Apps that are known to feed Google Health (directly or through Health Connect). Matched by
 * package name prefix, the longest prefix wins. The kind is only a fallback: a wrist form factor
 * or a phone form factor on a point always decides first.
 */
const KNOWN_APPS: readonly { prefix: string; label: string; kind: WearableDeviceKind }[] = [
  { prefix: "com.huami.watch.hmwatchmanager", label: "Zepp (Amazfit)", kind: "wearable" },
  { prefix: "com.huami", label: "Zepp (Amazfit)", kind: "wearable" },
  { prefix: "com.zepp", label: "Zepp (Amazfit)", kind: "wearable" },
  { prefix: "com.fitbit", label: "Fitbit", kind: "wearable" },
  { prefix: "com.google.android.apps.fitness", label: "Google Fit", kind: "other" },
  { prefix: "com.garmin.android.apps.connectmobile", label: "Garmin Connect", kind: "wearable" },
  { prefix: "com.xiaomi.wearable", label: "Mi Fitness", kind: "wearable" },
  { prefix: "com.mi.health", label: "Mi Fitness", kind: "wearable" },
  { prefix: "com.huawei.health", label: "Huawei Health", kind: "wearable" },
  { prefix: "com.samsung.android.wear", label: "Samsung Health", kind: "other" },
  { prefix: "com.sec.android.app.shealth", label: "Samsung Health", kind: "other" },
  { prefix: "com.google.android.apps.wear", label: "Pixel Watch", kind: "wearable" },
  { prefix: "com.google.android.wearable", label: "Pixel Watch", kind: "wearable" },
  { prefix: "com.ouraring.oura", label: "Oura", kind: "wearable" },
  { prefix: "com.withings", label: "Withings", kind: "other" },
  { prefix: PHONE_APP_PREFIX, label: THIS_PHONE, kind: "phone" },
];

function clean(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function knownApp(packageName: string): { label: string; kind: WearableDeviceKind } | null {
  const pkg = packageName.toLowerCase();
  let best: (typeof KNOWN_APPS)[number] | null = null;
  for (const app of KNOWN_APPS) {
    if (pkg.startsWith(app.prefix) && (!best || app.prefix.length > best.prefix.length)) best = app;
  }
  return best ? { label: best.label, kind: best.kind } : null;
}

/** formFactor is an open string; wrist, band and ring shapes count as a wearable. */
export function deviceKindFromFormFactor(formFactor: string | undefined): WearableDeviceKind {
  const f = clean(formFactor).toUpperCase();
  if (f === "") return "other";
  if (/(WATCH|WRIST|BAND|RING)/.test(f)) return "wearable";
  if (/(PHONE|TABLET)/.test(f)) return "phone";
  return "other";
}

function deviceName(manufacturer: string, model: string): string {
  if (manufacturer && model) {
    return model.toLowerCase().startsWith(manufacturer.toLowerCase())
      ? model
      : `${manufacturer} ${model}`;
  }
  return model || manufacturer;
}

function lastSegment(packageName: string): string {
  const part = packageName.split(".").filter(Boolean).pop() ?? "";
  return part ? part.charAt(0).toUpperCase() + part.slice(1) : "";
}

/** What one data point says about its source. */
type PointFacts = {
  id: string;
  /** "wearable" or "phone" when this point shows a wrist or phone form factor or a phone app. */
  formKind: "wearable" | "phone" | null;
  appKind: WearableDeviceKind | null;
  name: string;
  appLabel: string;
};

function readPoint(source: HealthDataSource | undefined): PointFacts {
  const device = source?.device;
  const manufacturer = clean(device?.manufacturer);
  const model = clean(device?.model);
  const formFactor = clean(device?.formFactor);
  const uid = clean(device?.uid);
  const packageName = clean(source?.application?.packageName);
  const appName = clean(source?.application?.name);
  const known = packageName ? knownApp(packageName) : null;

  // The source app is the identity: devices often come with empty fields (Health Connect).
  let id = UNKNOWN_ID;
  if (packageName) id = uid ? `${packageName}|${uid}` : packageName;
  else if (uid) id = uid;
  else if (manufacturer || model || formFactor) {
    id = [manufacturer, model, formFactor].filter(Boolean).join("|");
  } else if (appName) id = appName;

  const fromForm = deviceKindFromFormFactor(formFactor);
  const isPhoneApp = packageName.toLowerCase().startsWith(PHONE_APP_PREFIX);
  const formKind =
    fromForm === "wearable" ? "wearable" : fromForm === "phone" || isPhoneApp ? "phone" : null;

  return {
    id,
    formKind,
    appKind: known?.kind ?? null,
    name: deviceName(manufacturer, model),
    appLabel: known?.label || appName || lastSegment(packageName),
  };
}

function pickKind(
  wearable: boolean,
  phone: boolean,
  appKind: WearableDeviceKind | null,
): WearableDeviceKind {
  if (wearable) return "wearable";
  if (phone) return "phone";
  return appKind ?? "other";
}

function buildLabel(kind: WearableDeviceKind, name: string, appLabel: string): string {
  if (kind === "wearable") {
    const shown = name || appLabel;
    return shown ? `Wearable · ${shown}` : "Unnamed wearable";
  }
  if (kind === "phone") {
    if (name) return `Phone · ${name}`;
    if (appLabel && appLabel !== THIS_PHONE) return `Phone · ${appLabel}`;
    return THIS_PHONE;
  }
  return name || appLabel || "Unknown device";
}

/** Stable id, kind and readable label for the source of one data point. */
export function describeDevice(source: HealthDataSource | undefined): DeviceInfo {
  const facts = readPoint(source);
  const kind = pickKind(facts.formKind === "wearable", facts.formKind === "phone", facts.appKind);
  return { id: facts.id, kind, label: buildLabel(kind, facts.name, facts.appLabel) };
}

/** Points per metric, as read from the API. Daily resting heart rate belongs under "heartRate". */
export type DevicePoints = Partial<Record<DeviceMetric, HealthDataPoint[]>>;

/** Which devices sent data, and which kinds of data each one has. Sorted: wearables, phones, others. */
export function buildDeviceList(points: DevicePoints): WearableDevice[] {
  type Merged = {
    device: WearableDevice;
    wearable: boolean;
    phone: boolean;
    appKind: WearableDeviceKind | null;
    name: string;
    appLabel: string;
  };
  const byId = new Map<string, Merged>();
  for (const metric of DEVICE_METRICS) {
    for (const point of points[metric] ?? []) {
      if (metric === "sleep" && point.sleep?.metadata?.nap === true) continue;
      const facts = readPoint(point.dataSource);
      let m = byId.get(facts.id);
      if (!m) {
        m = {
          device: { id: facts.id, kind: "other", label: "", metrics: [], sampleCounts: {} },
          wearable: false,
          phone: false,
          appKind: null,
          name: "",
          appLabel: "",
        };
        byId.set(facts.id, m);
      }
      // One app can report several form factors (the wearable and the phone it runs on): merge them.
      if (facts.formKind === "wearable") m.wearable = true;
      if (facts.formKind === "phone") m.phone = true;
      m.appKind = m.appKind ?? facts.appKind;
      if (facts.name.length > m.name.length) m.name = facts.name;
      m.appLabel = m.appLabel || facts.appLabel;
      const { device } = m;
      if (!device.metrics.includes(metric)) device.metrics.push(metric);
      const counts = device.sampleCounts ?? {};
      counts[metric] = (counts[metric] ?? 0) + 1;
      device.sampleCounts = counts;
    }
  }

  const merged: WearableDevice[] = [...byId.values()].map((m) => {
    const kind = pickKind(m.wearable, m.phone, m.appKind);
    return { ...m.device, kind, label: buildLabel(kind, m.name, m.appLabel) };
  });

  const rank: Record<WearableDeviceKind, number> = { wearable: 0, phone: 1, other: 2 };
  const devices = merged.sort(
    (a, b) =>
      rank[a.kind] - rank[b.kind] || a.label.localeCompare(b.label) || a.id.localeCompare(b.id),
  );
  // Two devices with the same name must stay tellable apart in the chips.
  const seen = new Map<string, number>();
  return devices.map((d) => {
    const n = (seen.get(d.label) ?? 0) + 1;
    seen.set(d.label, n);
    return n === 1 ? d : { ...d, label: `${d.label} (${n})` };
  });
}

/**
 * Automatic choice for one metric: among the devices that have it, prefer a wearable, then a phone,
 * then anything else; the device with the most records wins a tie. null when no device has it.
 */
export function autoDeviceFor(devices: WearableDevice[], metric: DeviceMetric): string | null {
  const rank: Record<WearableDeviceKind, number> = { wearable: 0, phone: 1, other: 2 };
  const candidates = devices.filter((d) => d.metrics.includes(metric));
  candidates.sort(
    (a, b) =>
      rank[a.kind] - rank[b.kind] ||
      (b.sampleCounts?.[metric] ?? 0) - (a.sampleCounts?.[metric] ?? 0) ||
      a.id.localeCompare(b.id),
  );
  return candidates[0]?.id ?? null;
}

/**
 * The device id to use for each metric. A saved choice is used only when that device still exists
 * and has the metric; otherwise the automatic rule decides. Never combines devices.
 */
export function resolveDeviceSelection(
  devices: WearableDevice[],
  selection: DeviceSelection = AUTOMATIC_SELECTION,
): DeviceSelection {
  const out: DeviceSelection = { steps: null, heartRate: null, sleep: null };
  for (const metric of DEVICE_METRICS) {
    const chosen = selection[metric];
    out[metric] =
      chosen !== null && devices.some((d) => d.id === chosen && d.metrics.includes(metric))
        ? chosen
        : autoDeviceFor(devices, metric);
  }
  return out;
}

/** The saved choices that are still valid; every other metric goes back to automatic (null). */
export function sanitizeDeviceSelection(
  devices: WearableDevice[],
  selection: DeviceSelection = AUTOMATIC_SELECTION,
): DeviceSelection {
  const out: DeviceSelection = { steps: null, heartRate: null, sleep: null };
  for (const metric of DEVICE_METRICS) {
    const chosen = selection[metric];
    out[metric] =
      chosen !== null && devices.some((d) => d.id === chosen && d.metrics.includes(metric))
        ? chosen
        : null;
  }
  return out;
}
