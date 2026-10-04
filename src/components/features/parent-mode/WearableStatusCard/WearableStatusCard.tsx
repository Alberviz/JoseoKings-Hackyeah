"use client";

import { Card, Chip, Heading, LinkButton, Stack, Text } from "@/components/ui";
import { ROUTES } from "@/config/app";
import { WEARABLE_STATUS_COPY } from "@/content/wearable-summary";
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
} from "./WearableStatusCard.style";

const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

type WearableStatusCardProps = {
  /** Last 7 days, oldest first. The last one is today. */
  statuses: DayStatus[];
  isDemo: boolean;
};

export function WearableStatusCard({ statuses, isDemo }: WearableStatusCardProps) {
  const today = statuses[statuses.length - 1];
  if (!today) return null;
  return (
    <Card label={WEARABLE_STATUS_COPY.title}>
      <Stack gap="md">
        <Stack gap="sm" direction="row" align="center">
          <Heading level={2}>{WEARABLE_STATUS_COPY.title}</Heading>
          <Chip
            label={isDemo ? WEARABLE_STATUS_COPY.demo : WEARABLE_STATUS_COPY.fromWearable}
            tone="default"
          />
        </Stack>
        <StatusRow>
          <StatusDot $tone={today.tone} aria-hidden="true" />
          <Text>{today.label}</Text>
        </StatusRow>
        <Text>{today.sentence}</Text>
        <StripList aria-label={WEARABLE_STATUS_COPY.stripLabel}>
          {statuses.map((status) => (
            <StripItem key={status.date}>
              <StripDot $tone={status.tone} aria-hidden="true" />
              <HiddenText>{`${status.date}: ${status.label}`}</HiddenText>
              <StripDay aria-hidden="true">{WEEKDAY_LETTERS[weekdayIndex(status.date)]}</StripDay>
            </StripItem>
          ))}
        </StripList>
        <LinkButton href={ROUTES.parentLog} variant="secondary" fullWidth>
          {WEARABLE_STATUS_COPY.logSigns}
        </LinkButton>
        <Text size="sm" tone="muted">
          {WEARABLE_STATUS_COPY.footnote}
        </Text>
      </Stack>
    </Card>
  );
}
