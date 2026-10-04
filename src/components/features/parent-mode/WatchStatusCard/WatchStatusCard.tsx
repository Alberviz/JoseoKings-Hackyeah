"use client";

import { Button, Card, Chip, Heading, LinkButton, Stack, Text } from "@/components/ui";
import { ROUTES } from "@/config/app";
import { WATCH_STATUS_COPY } from "@/content/watch-summary";
import { weekdayIndex } from "@/lib/dates";
import type { DayStatus } from "@/lib/patterns";
import {
  HiddenText,
  StatusDot,
  StatusRow,
  StripDay,
  StripDot,
  StripItem,
  StripList,
} from "./WatchStatusCard.style";

const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

type WatchStatusCardProps = {
  /** Last 7 days, oldest first. The last one is today. */
  statuses: DayStatus[];
  isDemo: boolean;
  alertReason: string;
  alertsAvailable: boolean;
  alertsPermission: "default" | "granted" | "denied";
  onEnableAlerts: () => void;
};

export function WatchStatusCard({
  statuses,
  isDemo,
  alertReason,
  alertsAvailable,
  alertsPermission,
  onEnableAlerts,
}: WatchStatusCardProps) {
  const today = statuses[statuses.length - 1];
  if (!today) return null;
  return (
    <Card label={WATCH_STATUS_COPY.title}>
      <Stack gap="md">
        <Stack gap="sm" direction="row" align="center">
          <Heading level={2}>{WATCH_STATUS_COPY.title}</Heading>
          <Chip
            label={isDemo ? WATCH_STATUS_COPY.demo : WATCH_STATUS_COPY.fromWatch}
            tone="default"
          />
        </Stack>
        <StatusRow>
          <StatusDot $tone={today.tone} aria-hidden="true" />
          <Text>{today.label}</Text>
        </StatusRow>
        <Text>{today.sentence}</Text>
        {alertReason ? <Text size="sm">{alertReason}</Text> : null}
        <StripList aria-label={WATCH_STATUS_COPY.stripLabel}>
          {statuses.map((status) => (
            <StripItem key={status.date}>
              <StripDot $tone={status.tone} aria-hidden="true" />
              <HiddenText>{`${status.date}: ${status.label}`}</HiddenText>
              <StripDay aria-hidden="true">{WEEKDAY_LETTERS[weekdayIndex(status.date)]}</StripDay>
            </StripItem>
          ))}
        </StripList>
        <LinkButton href={ROUTES.parentLog} variant="secondary" fullWidth>
          {WATCH_STATUS_COPY.logSigns}
        </LinkButton>
        {alertsAvailable && alertsPermission === "default" ? (
          <Button variant="secondary" onClick={onEnableAlerts} fullWidth>
            {WATCH_STATUS_COPY.alertsOn}
          </Button>
        ) : null}
        {alertsAvailable && alertsPermission === "denied" ? (
          <Text size="sm" tone="muted">
            {WATCH_STATUS_COPY.alertsBlocked}
          </Text>
        ) : null}
        <Text size="sm" tone="muted">
          {WATCH_STATUS_COPY.footnote}
        </Text>
      </Stack>
    </Card>
  );
}
