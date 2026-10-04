"use client";

import { Button, Card, Chip, Heading, Stack, Text } from "@/components/ui";
import { useWearableSync } from "@/hooks/useWearableSync";
import {
  DEVICE_METRICS,
  resolveDeviceSelection,
  sanitizeDeviceSelection,
} from "@/lib/wearables/devices";
import { describeSyncStatus } from "@/lib/wearables/metricStatusText";
import type { DeviceMetric } from "@/types/wearable";
import { WearableDeviceChoice } from "../WearableDeviceChoice/WearableDeviceChoice";
import { ButtonRow, StatusMessage } from "./WearableConnectCard.style";

const CARD_TITLE = "Child's wearable";

const INTRO_TEXT =
  "Read steps, heart rate and sleep from the child's wearable with Google Health. The numbers are kept only on this phone.";

const METRIC_LABELS: Record<DeviceMetric, string> = {
  steps: "Steps",
  heartRate: "Heart rate",
  sleep: "Sleep",
};

function formatLastSync(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

export function WearableConnectCard() {
  const {
    wearable,
    status,
    message,
    metricStatus,
    isConfigured,
    sync,
    useDemo,
    clear,
    selectDevice,
  } = useWearableSync();
  const isWorking = status === "working";
  const hasDays = wearable.days.length > 0;
  const hasRealData = hasDays && !wearable.isDemo;

  let statusText = "No wearable data yet.";
  if (isWorking) {
    statusText = "Reading the last 28 days from the wearable...";
  } else if (hasDays) {
    const when = formatLastSync(wearable.lastSyncAt);
    statusText = `${wearable.days.length} days on this phone${when ? `, updated ${when}` : ""}.`;
  }

  const devices = wearable.devices ?? [];
  const selection = sanitizeDeviceSelection(devices, wearable.deviceSelection);
  const resolved = resolveDeviceSelection(devices, selection);
  const syncLines = metricStatus ? describeSyncStatus(metricStatus) : [];
  const labelOf = (id: string | null) => devices.find((d) => d.id === id)?.label ?? null;

  return (
    <Card label={CARD_TITLE}>
      <Stack gap="md">
        <Stack gap="sm" direction="row" align="center">
          <Heading level={2}>{CARD_TITLE}</Heading>
          {wearable.isDemo && hasDays ? <Chip label="Demo data" tone="primary" /> : null}
        </Stack>
        <Text size="sm" tone="muted">
          {INTRO_TEXT}
        </Text>
        <Text size="sm">{statusText}</Text>
        {devices.length > 0 && !wearable.isDemo ? (
          <Stack gap="sm">
            <Text size="sm" tone="muted">
              Data from
            </Text>
            {DEVICE_METRICS.map((metric) => {
              const forMetric = devices.filter((d) => d.metrics.includes(metric));
              if (forMetric.length === 0) return null;
              if (forMetric.length === 1) {
                return (
                  <Text key={metric} size="sm">
                    {`${METRIC_LABELS[metric]}: ${forMetric[0].label}`}
                  </Text>
                );
              }
              return (
                <WearableDeviceChoice
                  key={metric}
                  metricLabel={METRIC_LABELS[metric]}
                  devices={forMetric}
                  selectedId={selection[metric]}
                  autoLabel={labelOf(resolved[metric])}
                  onSelect={(id) => selectDevice(metric, id)}
                />
              );
            })}
          </Stack>
        ) : null}
        {syncLines.length > 0 ? (
          <Stack gap="xs">
            {syncLines.map((line) => (
              <Text key={line.key} size="sm" tone="muted">
                {line.text}
              </Text>
            ))}
          </Stack>
        ) : null}
        {message ? (
          <StatusMessage
            $isError={status === "error"}
            role={status === "error" ? "alert" : "status"}
          >
            {message}
          </StatusMessage>
        ) : null}
        {isConfigured ? null : (
          <StatusMessage $isError={false}>
            Wearable connection is not set up in this build. Demo data still works.
          </StatusMessage>
        )}
        <ButtonRow>
          {hasRealData ? (
            <Button variant="primary" onClick={sync} disabled={isWorking || !isConfigured}>
              Sync wearable
            </Button>
          ) : (
            <Button variant="primary" onClick={sync} disabled={isWorking || !isConfigured}>
              Connect wearable
            </Button>
          )}
          <Button variant="secondary" onClick={useDemo} disabled={isWorking}>
            Use demo data
          </Button>
          {hasDays ? (
            <Button variant="secondary" onClick={clear} disabled={isWorking}>
              Remove wearable data
            </Button>
          ) : null}
        </ButtonRow>
      </Stack>
    </Card>
  );
}
