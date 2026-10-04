// Devices that send data to Google Health, and which of them feeds each metric.
// Pure functions: no React, no storage. The id of a device is used as WatchSample.source.
import type { DeviceMetric, DeviceSelection, WatchDevice, WatchDeviceKind } from "@/types/watch";
import type { HealthDataPoint, HealthDataSource } from "./googleHealthV4";

export const DEVICE_METRICS: readonly DeviceMetric[] = ["steps", "heartRate", "sleep"];

export const AUTOMATIC_SELECTION: DeviceSelection = { steps: null, heartRate: null, sleep: null };

export type DeviceInfo = { id: string; kind: WatchDeviceKind; label: string };

const UNKNOWN_ID = "unknown";

function clean(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/** formFactor is an open string; wrist, band and ring shapes count as a watch. */
export function deviceKindFromFormFactor(formFactor: string | undefined): WatchDeviceKind {
  const f = clean(formFactor).toUpperCase();
  if (f === "") return "other";
  if (/(WATCH|WRIST|BAND|RING)/.test(f)) return "watch";
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

/** Stable id, kind and readable label for the source of one data point. */
export function describeDevice(source: HealthDataSource | undefined): DeviceInfo {
  const device = source?.device;
  const manufacturer = clean(device?.manufacturer);
  const model = clean(device?.model);
  const formFactor = clean(device?.formFactor);
  const uid = clean(device?.uid);
  const app = clean(source?.application?.name) || clean(source?.application?.packageName);

  let id = UNKNOWN_ID;
  if (uid) id = uid;
  else if (manufacturer || model || formFactor) id = `${manufacturer}|${model}|${formFactor}`;
  else if (app) id = app;

  const kind = deviceKindFromFormFactor(formFactor);
  const name = deviceName(manufacturer, model);
  let label: string;
  if (name) {
    label = kind === "watch" ? `Watch · ${name}` : kind === "phone" ? `Phone · ${name}` : name;
  } else if (kind === "watch") {
    label = "Unnamed watch";
  } else if (kind === "phone") {
    label = "Unnamed phone";
  } else {
    label = app || "Unknown device";
  }
  return { id, kind, label };
}

/** Points per metric, as read from the API. Daily resting heart rate belongs under "heartRate". */
export type DevicePoints = Partial<Record<DeviceMetric, HealthDataPoint[]>>;

/** Which devices sent data, and which kinds of data each one has. Sorted: watches, phones, others. */
export function buildDeviceList(points: DevicePoints): WatchDevice[] {
  const byId = new Map<string, WatchDevice>();
  for (const metric of DEVICE_METRICS) {
    for (const point of points[metric] ?? []) {
      if (metric === "sleep" && point.sleep?.metadata?.nap === true) continue;
      const info = describeDevice(point.dataSource);
      let device = byId.get(info.id);
      if (!device) {
        device = { ...info, metrics: [], sampleCounts: {} };
        byId.set(info.id, device);
      }
      if (!device.metrics.includes(metric)) device.metrics.push(metric);
      const counts = device.sampleCounts ?? {};
      counts[metric] = (counts[metric] ?? 0) + 1;
      device.sampleCounts = counts;
    }
  }

  const rank: Record<WatchDeviceKind, number> = { watch: 0, phone: 1, other: 2 };
  const devices = [...byId.values()].sort(
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
 * Automatic choice for one metric: among the devices that have it, prefer a watch, then a phone,
 * then anything else; the device with the most records wins a tie. null when no device has it.
 */
export function autoDeviceFor(devices: WatchDevice[], metric: DeviceMetric): string | null {
  const rank: Record<WatchDeviceKind, number> = { watch: 0, phone: 1, other: 2 };
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
  devices: WatchDevice[],
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
  devices: WatchDevice[],
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
