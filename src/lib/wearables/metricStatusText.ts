// Plain-English lines that tell the parent what each wearable metric returned in the last sync.
import type { FetchedMetricKey, MetricFetchStatus } from "./browserGoogleHealth";

type Line = { key: FetchedMetricKey; text: string };

const LABELS: Record<FetchedMetricKey, string> = {
  steps: "Steps",
  heartRate: "Heart rate",
  restingHrDaily: "Resting heart rate",
  sleep: "Sleep",
};

const UNITS: Record<FetchedMetricKey, [string, string]> = {
  steps: ["record", "records"],
  heartRate: ["reading", "readings"],
  restingHrDaily: ["day", "days"],
  sleep: ["night", "nights"],
};

function failureReason(status: Exclude<MetricFetchStatus, { status: "ok" }>): string {
  switch (status.status) {
    case "http-error": {
      const said = status.reason ?? status.message;
      return said ? `Google said: ${said}` : `error ${status.httpStatus}`;
    }
    case "network-error":
      return "no connection";
    case "invalid-response":
      return "unexpected answer";
  }
}

export function describeMetricStatus(key: FetchedMetricKey, status: MetricFetchStatus): string {
  const label = LABELS[key];
  if (status.status !== "ok") return `${label}: could not be read (${failureReason(status)})`;
  const count = status.count;
  if (count === undefined) return `${label}: read`;
  if (count === 0) return `${label}: No wearable data yet`;
  const [one, many] = UNITS[key];
  const text = `${label}: ${count} ${count === 1 ? one : many}`;
  return status.partial ? `${text} (only part of the data could be read)` : text;
}

/**
 * One line per metric of the last sync. The wearable's own resting heart rate is a side detail:
 * it only gets a line when it could not be read.
 */
export function describeSyncStatus(
  metricStatus: Partial<Record<FetchedMetricKey, MetricFetchStatus>>,
): Line[] {
  const order: FetchedMetricKey[] = ["steps", "heartRate", "sleep", "restingHrDaily"];
  const lines: Line[] = [];
  for (const key of order) {
    const status = metricStatus[key];
    if (!status) continue;
    if (key === "restingHrDaily" && status.status === "ok") continue;
    lines.push({ key, text: describeMetricStatus(key, status) });
  }
  return lines;
}
