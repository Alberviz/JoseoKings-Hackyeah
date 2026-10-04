"use client";

import { Button, Card, Chip, Heading, LinkButton, Stack, Text } from "@/components/ui";
import { ROUTES } from "@/config/app";
import { DISCOMFORT_THRESHOLD, QUESTION_IDS } from "@/config/content-ids";
import { todayKey } from "@/lib/dates";
import { confidenceLabel } from "@/lib/rewards";
import type { AppState } from "@/types";
import { CHECK_IN_QUESTIONS } from "@/content/check-in-questions";
import { shouldShowInAppReminder } from "@/lib/reminder/reminder";
import { formatMissionTitle } from "../missionLabels";
import {
  AnswerLabel,
  AnswerValue,
  DegreeFaceCircle,
  DegreeFaceEye,
  DegreeFaceMouth,
  DegreeFaceSvg,
  FactItem,
  FactList,
  MissionHeader,
  MissionItem,
  NavGrid,
  PromptCard,
  SummaryContainer,
} from "./SummaryCard.style";

function getCheckInAnswerLabel(questionId: string, answerValue: unknown): string {
  if (typeof answerValue !== "number") return "-";
  const question = CHECK_IN_QUESTIONS.find((q) => q.id === questionId);
  const option = question?.options.find((o) => o.value === answerValue);
  return option?.label ?? "-";
}

function DegreeFace({ level }: { level: number }) {
  if (level === 0) {
    return (
      <DegreeFaceSvg viewBox="0 0 20 20" aria-hidden="true">
        <DegreeFaceCircle cx="10" cy="10" r="9" />
        <DegreeFaceEye cx="7" cy="8" r="1.3" />
        <DegreeFaceEye cx="13" cy="8" r="1.3" />
        <DegreeFaceMouth d="M6.5 12 Q10 16 13.5 12" />
      </DegreeFaceSvg>
    );
  }
  if (level === 1) {
    return (
      <DegreeFaceSvg viewBox="0 0 20 20" aria-hidden="true">
        <DegreeFaceCircle cx="10" cy="10" r="9" />
        <DegreeFaceEye cx="7" cy="8" r="1.3" />
        <DegreeFaceEye cx="13" cy="8" r="1.3" />
        <DegreeFaceMouth d="M7 13 H13" />
      </DegreeFaceSvg>
    );
  }
  if (level === 2) {
    return (
      <DegreeFaceSvg viewBox="0 0 20 20" aria-hidden="true">
        <DegreeFaceCircle cx="10" cy="10" r="9" />
        <DegreeFaceEye cx="7" cy="8" r="1.3" />
        <DegreeFaceEye cx="13" cy="8" r="1.3" />
        <DegreeFaceMouth d="M6.5 14 Q10 10.5 13.5 14" />
      </DegreeFaceSvg>
    );
  }
  return null;
}

type AnswerRowProps = {
  label: string;
  questionId: string;
  value: unknown;
};

function AnswerRow({ label, questionId, value }: AnswerRowProps) {
  return (
    <FactItem>
      <Text size="sm">{label}</Text>
      <AnswerValue>
        {typeof value === "number" ? <DegreeFace level={value} /> : null}
        <AnswerLabel>{getCheckInAnswerLabel(questionId, value)}</AnswerLabel>
      </AnswerValue>
    </FactItem>
  );
}

type SummaryCardProps = {
  state: AppState;
  onLock: () => void;
};

export function SummaryCard({ state, onLock }: SummaryCardProps) {
  const today = todayKey();
  const childName = state.child?.nickname ?? "your child";

  const todayCheckIn = state.checkIns.find((item) => item.date === today);
  const todayMissions = state.missionLogs.filter((item) => item.date === today);

  const todayLog = state.parentLogs.find((item) => item.date === today);
  const showReminder = shouldShowInAppReminder(state.settings, todayLog?.medicationTaken);

  const bellyAnswer = todayCheckIn?.answers[QUESTION_IDS.bellyComfort];
  const hasDiscomfort = typeof bellyAnswer === "number" && bellyAnswer >= DISCOMFORT_THRESHOLD;

  return (
    <SummaryContainer>
      <Stack gap="lg">
        <Stack gap="xs">
          <Stack gap="sm" direction="row" align="center">
            <Heading level={1}>Parent mode</Heading>
            {state.isDemo ? <Chip label="Demo data" tone="primary" /> : null}
          </Stack>
          <Text tone="muted">Daily summary for {childName}</Text>
        </Stack>

        {showReminder ? (
          <PromptCard role="status">
            <Stack gap="xs">
              <Heading level={2}>Daily care reminder</Heading>
              <Text size="sm">
                Time for {childName}&apos;s daily routine. Have you logged today&apos;s care?
              </Text>
              <LinkButton href={ROUTES.parentLog} variant="secondary">
                Go to daily log
              </LinkButton>
            </Stack>
          </PromptCard>
        ) : null}

        <Card label="Today's performance">
          <Stack gap="md">
            <Heading level={2}>Today&apos;s performance</Heading>
            <Stack gap="sm">
              <Text size="sm" tone="muted">
                Check-in
              </Text>
              {!todayCheckIn ? (
                <Text tone="muted">None yet</Text>
              ) : todayCheckIn.notToday ? (
                <Stack gap="xs">
                  <Text tone="muted">Not today</Text>
                  <Text size="sm">The child chose not to check in today.</Text>
                </Stack>
              ) : (
                <Stack gap="sm">
                  <Text>Answered</Text>
                  <FactList>
                    <AnswerRow
                      label="Belly comfort"
                      questionId={QUESTION_IDS.bellyComfort}
                      value={todayCheckIn.answers[QUESTION_IDS.bellyComfort]}
                    />
                    <AnswerRow
                      label="Energy"
                      questionId={QUESTION_IDS.energy}
                      value={todayCheckIn.answers[QUESTION_IDS.energy]}
                    />
                    <AnswerRow
                      label="Play pace"
                      questionId={QUESTION_IDS.playPace}
                      value={todayCheckIn.answers[QUESTION_IDS.playPace]}
                    />
                    {todayCheckIn.childNote ? (
                      <FactItem>
                        <Text size="sm">Note</Text>
                        <Text size="sm">{todayCheckIn.childNote}</Text>
                      </FactItem>
                    ) : null}
                  </FactList>
                </Stack>
              )}
            </Stack>
            <Stack gap="sm">
              <Text size="sm" tone="muted">
                Missions and play
              </Text>
              {todayMissions.length === 0 ? (
                <Text tone="muted">None today</Text>
              ) : (
                <FactList>
                  {todayMissions.map((log) => (
                    <MissionItem key={log.id}>
                      <MissionHeader>
                        <Text>{formatMissionTitle(log.missionId)}</Text>
                        <Chip label={confidenceLabel(log.company)} tone="default" />
                      </MissionHeader>
                      <Text size="sm" tone="muted">
                        Status: {log.status === "completed" ? "Completed" : "Rest"}
                      </Text>
                    </MissionItem>
                  ))}
                </FactList>
              )}
            </Stack>
          </Stack>
        </Card>

        {hasDiscomfort ? (
          <PromptCard role="region" aria-label="Food note prompt">
            <Text>Want to note what {childName} ate today?</Text>
            <LinkButton href={ROUTES.parentFoods} variant="primary">
              Open food diary
            </LinkButton>
          </PromptCard>
        ) : null}

        <Card label="Parent sections">
          <Stack gap="md">
            <Heading level={2}>Parent sections</Heading>
            <NavGrid aria-label="Parent mode navigation">
              <LinkButton href={ROUTES.parentLog} variant="secondary" fullWidth>
                Daily log
              </LinkButton>
              <LinkButton href={ROUTES.parentFoods} variant="secondary" fullWidth>
                Food diary
              </LinkButton>
              <LinkButton href={ROUTES.parentPatterns} variant="secondary" fullWidth>
                Patterns
              </LinkButton>
              <LinkButton href={ROUTES.parentReport} variant="secondary" fullWidth>
                Doctor report
              </LinkButton>
              <LinkButton href={ROUTES.parentSettings} variant="secondary" fullWidth>
                Settings
              </LinkButton>
              <LinkButton href={ROUTES.parentLink} variant="secondary" fullWidth>
                Family link
              </LinkButton>
            </NavGrid>
          </Stack>
        </Card>

        <Stack gap="sm">
          <Button variant="secondary" onClick={onLock} fullWidth>
            Lock
          </Button>
          <LinkButton href={ROUTES.home} variant="secondary" fullWidth>
            Back to child mode
          </LinkButton>
        </Stack>
      </Stack>
    </SummaryContainer>
  );
}
