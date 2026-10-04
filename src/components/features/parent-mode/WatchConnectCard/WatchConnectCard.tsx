"use client";

import { Button, Card, Chip, Heading, Stack, Text } from "@/components/ui";
import { useWatchSync } from "@/hooks/useWatchSync";
import {
  DEVICE_METRICS,
  resolveDeviceSelection,
  sanitizeDeviceSelection,
} from "@/lib/wearables/devices";
import { describeSyncStatus } from "@/lib/wearables/metricStatusText";
import type { DeviceMetric } from "@/types/watch";
import { WatchDeviceChoice } from "../WatchDeviceChoice/WatchDeviceChoice";
import { ButtonRow, StatusMessage } from "./WatchConnectCard.style";

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

export function WatchConnectCard() {
  const { watch, status, message, metricStatus, isConfigured, sync, useDemo, clear, selectDevice } =
    useWatchSync();
  const isWorking = status === "working";
  const hasDays = watch.days.length > 0;
  const hasRealData = hasDays && !watch.isDemo;

  let statusText = "No watch data yet.";
  if (isWorking) {
    statusText = "Reading the last 28 days from the watch...";
  } else if (hasDays) {
    const when = formatLastSync(watch.lastSyncAt);
    statusText = `${watch.days.length} days on this phone${when ? `, updated ${when}` : ""}.`;
  }

  const devices = watch.devices ?? [];
  const selection = sanitizeDeviceSelection(devices, watch.deviceSelection);
  const resolved = resolveDeviceSelection(devices, selection);
  const syncLines = metricStatus ? describeSyncStatus(metricStatus) : [];
  const labelOf = (id: string | null) => devices.find((d) => d.id === id)?.label ?? null;

  return (
    <Card label="Watch">
      <Stack gap="md">
        <Stack gap="sm" direction="row" align="center">
          <Heading level={2}>Watch</Heading>
          {watch.isDemo && hasDays ? <Chip label="Demo data" tone="primary" /> : null}
        </Stack>
        <Text size="sm" tone="muted">
          Read steps, heart rate and sleep from the watch with Google Health. The numbers are kept
          only on this phone.
        </Text>
        <Text size="sm">{statusText}</Text>
        {devices.length > 0 && !watch.isDemo ? (
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
                <WatchDeviceChoice
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
            Watch connection is not set up in this build. Demo data still works.
          </StatusMessage>
        )}
        <ButtonRow>
          {hasRealData ? (
            <Button variant="primary" onClick={sync} disabled={isWorking || !isConfigured}>
              Sync now
            </Button>
          ) : (
            <Button variant="primary" onClick={sync} disabled={isWorking || !isConfigured}>
              Connect watch
            </Button>
          )}
          <Button variant="secondary" onClick={useDemo} disabled={isWorking}>
            Use demo data
          </Button>
          {hasDays ? (
            <Button variant="secondary" onClick={clear} disabled={isWorking}>
              Remove watch data
            </Button>
          ) : null}
        </ButtonRow>
      </Stack>
    </Card>
  );
}
