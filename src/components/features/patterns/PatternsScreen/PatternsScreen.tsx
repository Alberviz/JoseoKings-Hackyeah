"use client";

import { useMemo } from "react";
import { PinGate } from "@/components/features/parent-mode";
import { Heading, LinkButton, Screen, Text } from "@/components/ui";
import { ROUTES } from "@/config/app";
import { PATTERNS_DISCLAIMER, REPORT_DISCLAIMER } from "@/content";
import { useAppState } from "@/hooks/useAppState";
import { useParentSession } from "@/hooks/useParentSession";
import { addDays, todayKey } from "@/lib/dates";
import {
  getDaySummaries,
  getFoodCooccurrence,
  getWeeklySeries,
  hasEnoughData,
  MIN_ANSWERED_DAYS,
} from "@/lib/patterns";
import { hasPin } from "@/lib/pin";
import { ColourCalendar } from "../ColourCalendar/ColourCalendar";
import { FoodCoOccurrence } from "../FoodCoOccurrence/FoodCoOccurrence";
import { WeeklyCharts } from "../WeeklyCharts/WeeklyCharts";
import {
  BackButtonWrapper,
  DemoBadge,
  DisclaimerCard,
  DisclaimerTitle,
  EmptyStateCard,
  HeaderBadgeRow,
  PatternsLayout,
  ScreenHeader,
} from "./PatternsScreen.style";

export function PatternsScreen() {
  const { state, isReady } = useAppState();
  const session = useParentSession();

  const today = todayKey();

  const fromDate = useMemo(() => {
    if (!state.checkIns || state.checkIns.length === 0) {
      return addDays(today, -27);
    }
    const minCheckIn = state.checkIns.reduce((min, c) => (c.date < min ? c.date : min), today);
    const ninetyDaysAgo = addDays(today, -89);
    return minCheckIn < ninetyDaysAgo ? minCheckIn : ninetyDaysAgo;
  }, [state.checkIns, today]);

  const summaries = useMemo(
    () => getDaySummaries(state, { from: fromDate, to: today }),
    [state, fromDate, today],
  );

  const enough = useMemo(() => hasEnoughData(summaries), [summaries]);
  const weeklySeries = useMemo(() => getWeeklySeries(summaries), [summaries]);
  const foodCooccurrence = useMemo(
    () => getFoodCooccurrence(state, { from: fromDate, to: today }),
    [state, fromDate, today],
  );

  if (!isReady) {
    return (
      <Screen>
        <PatternsLayout>
          <ScreenHeader>
            <Heading level={1}>Patterns & Trends</Heading>
            <Text tone="muted">Loading patterns data...</Text>
          </ScreenHeader>
        </PatternsLayout>
      </Screen>
    );
  }

  const hasConfiguredPin = hasPin(state.settings);

  if (!state.child || !hasConfiguredPin) {
    return (
      <Screen>
        <PinGate
          title="Setup needed"
          description="Parent mode requires a child profile and a 4-digit PIN."
        />
      </Screen>
    );
  }

  if (!session.isUnlocked) {
    return (
      <Screen>
        <PinGate
          title="Parent patterns"
          description="Enter your 4-digit PIN to access patterns and trends."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PatternsLayout>
        <BackButtonWrapper>
          <LinkButton href={ROUTES.parent} variant="secondary">
            ← Back to parent summary
          </LinkButton>
        </BackButtonWrapper>

        <ScreenHeader>
          <Heading level={1}>Patterns & Trends</Heading>
          <Text tone="muted">
            Overview of recorded daily check-ins, sleep and reported discomfort over time.
          </Text>
          {state.isDemo && (
            <HeaderBadgeRow>
              <DemoBadge>Demo data (Lucas, 90 days)</DemoBadge>
            </HeaderBadgeRow>
          )}
        </ScreenHeader>

        {!enough.enough ? (
          <EmptyStateCard>
            <Heading level={2}>Not enough data yet</Heading>
            <Text tone="muted">
              At least {MIN_ANSWERED_DAYS} days of answered daily check-ins are required to display
              meaningful patterns and trends. So far, {enough.answeredDays}{" "}
              {enough.answeredDays === 1 ? "day has" : "days have"} been answered.
            </Text>
            <LinkButton href={ROUTES.parentSettings} variant="primary">
              Go to Parent Settings
            </LinkButton>
          </EmptyStateCard>
        ) : (
          <>
            <ColourCalendar summaries={summaries} />

            <WeeklyCharts series={weeklySeries} />

            <FoodCoOccurrence termCounts={foodCooccurrence.termCounts} />

            <DisclaimerCard role="note" aria-label="Medical disclaimer">
              <DisclaimerTitle>Important Notice</DisclaimerTitle>
              <Text tone="muted">{PATTERNS_DISCLAIMER}</Text>
              <Text tone="muted">{REPORT_DISCLAIMER}</Text>
            </DisclaimerCard>
          </>
        )}
      </PatternsLayout>
    </Screen>
  );
}
