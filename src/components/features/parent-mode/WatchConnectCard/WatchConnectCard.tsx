"use client";

import { Button, Card, Chip, Heading, Stack, Text } from "@/components/ui";
import { useWatchSync } from "@/hooks/useWatchSync";
import { ButtonRow, StatusMessage } from "./WatchConnectCard.style";

function formatLastSync(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

export function WatchConnectCard() {
  const { watch, status, message, isConfigured, sync, useDemo, clear } = useWatchSync();
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
