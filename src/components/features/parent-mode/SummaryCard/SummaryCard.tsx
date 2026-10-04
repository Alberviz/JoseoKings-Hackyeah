"use client";

import { useEffect } from "react";
import { Chip, LinkButton, Stack, Text } from "@/components/ui";
import type { ChipTone } from "@/components/ui";
import { ROUTES } from "@/config/app";
import { DISCOMFORT_THRESHOLD, QUESTION_IDS } from "@/config/content-ids";
import { todayKey } from "@/lib/dates";
import { corroborationLabel } from "@/lib/missions/corroboration";
import { confidenceLabel } from "@/lib/rewards";
import type { AppState } from "@/types";
import { CHECK_IN_QUESTIONS } from "@/content/check-in-questions";
import { getActiveNotifications, triggerSystemNotification } from "@/lib/notifications";
import {
  formatAppointmentCountdown,
  formatConsultationDaysAgo,
  getConsultationSummary,
} from "@/lib/consultation/consultation";
import { formatMissionTitle } from "../missionLabels";
import { WatchSummary } from "../WatchSummary/WatchSummary";
import { ParentBanner } from "../ParentBanner/ParentBanner";
import { SectionCard } from "../SectionCard/SectionCard";
import {
  AnswerValue,
  AppointmentDateText,
  AppointmentRow,
  DegreeFaceCircle,
  DegreeFaceEye,
  DegreeFaceMouth,
  DegreeFaceSvg,
  FactItem,
  FactList,
  MissionHeader,
  MissionItem,
  SummaryContainer,
} from "./SummaryCard.style";

function getCheckInAnswerLabel(questionId: string, answerValue: unknown): string {
  if (typeof answerValue !== "number") return "-";
  const question = CHECK_IN_QUESTIONS.find((q) => q.id === questionId);
  const option = question?.options.find((o) => o.value === answerValue);
  return option?.label ?? "-";
}

function toneForAnswer(value: unknown): ChipTone {
  if (value === 0) return "success";
  if (value === 1) return "mixed";
  if (value === 2) return "harder";
  return "default";
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
        <Chip label={getCheckInAnswerLabel(questionId, value)} tone={toneForAnswer(value)} />
      </AnswerValue>
    </FactItem>
  );
}

type SummaryCardProps = {
  state: AppState;
};

export function SummaryCard({ state }: SummaryCardProps) {
  const today = todayKey();
  const childName = state.child?.nickname ?? "your child";

  const todayCheckIn = state.checkIns.find((item) => item.date === today);
  const todayMissions = state.missionLogs.filter((item) => item.date === today);

  const todayLog = state.parentLogs.find((item) => item.date === today);
  const activeNotifications = getActiveNotifications({
    settings: state.settings,
    todayLog,
    consultations: state.consultations,
    economy: state.economy,
    hasChildCheckedInToday: !!todayCheckIn,
    childNickname: childName,
  }).filter((n) => n.audience === "parent");

  useEffect(() => {
    for (const notif of activeNotifications) {
      if (notif.priority === "high") {
        triggerSystemNotification(notif);
      }
    }
  }, [activeNotifications]);

  const bellyAnswer = todayCheckIn?.answers[QUESTION_IDS.bellyComfort];
  const hasDiscomfort = typeof bellyAnswer === "number" && bellyAnswer >= DISCOMFORT_THRESHOLD;

  const consultationSummary = getConsultationSummary(state.consultations, today);
  const nextAppointment = consultationSummary.nextAppointment;
  const lastConsultation = consultationSummary.lastConsultation;

  return (
    <SummaryContainer>
      <Stack gap="lg">
        <ParentBanner
          section="summary"
          icon="summary"
          title="Parent mode"
          subtitle={
            <Stack gap="sm" direction="row" align="center">
              <Text size="sm">Daily summary for {childName}</Text>
              {state.isDemo ? <Chip label="Demo data" tone="primary" /> : null}
            </Stack>
          }
        />

        {activeNotifications.map((notif) => (
          <SectionCard key={notif.id} section="log" title={notif.title}>
            <Stack gap="xs">
              <Text size="sm">{notif.body}</Text>
              {notif.actionUrl && notif.actionLabel ? (
                <LinkButton href={notif.actionUrl} variant="success" fullWidth>
                  {notif.actionLabel}
                </LinkButton>
              ) : null}
            </Stack>
          </SectionCard>
        ))}

        <SectionCard section="summary" title="Today's performance">
          <Stack gap="md">
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
                        {log.corroboration ? (
                          <Chip label={corroborationLabel(log.corroboration)} tone="default" />
                        ) : null}
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
        </SectionCard>

        <WatchSummary state={state} />

        {hasDiscomfort ? (
          <SectionCard section="food" title="Food note" label="Food note prompt">
            <Stack gap="sm">
              <Text>Want to note what {childName} ate today?</Text>
              <LinkButton href={ROUTES.parentFoods} variant="accent" fullWidth>
                Open food diary
              </LinkButton>
            </Stack>
          </SectionCard>
        ) : null}

        <SectionCard section="more" title="Doctor appointments">
          <Stack gap="md">
            <Stack gap="xs">
              <Text size="sm" tone="muted">
                Next appointment
              </Text>
              {nextAppointment ? (
                <AppointmentRow>
                  <AppointmentDateText>{nextAppointment.date}</AppointmentDateText>
                  <Chip
                    label={formatAppointmentCountdown(today, nextAppointment.date)}
                    tone="primary"
                  />
                </AppointmentRow>
              ) : (
                <Text tone="muted">No upcoming appointment scheduled</Text>
              )}
            </Stack>

            <Stack gap="xs">
              <Text size="sm" tone="muted">
                Last consultation
              </Text>
              {lastConsultation ? (
                <AppointmentRow>
                  <AppointmentDateText>{lastConsultation.date}</AppointmentDateText>
                  <Text size="sm" tone="muted">
                    {formatConsultationDaysAgo(today, lastConsultation.date)}
                  </Text>
                </AppointmentRow>
              ) : (
                <Text tone="muted">No past consultations recorded</Text>
              )}
            </Stack>

            <LinkButton href={ROUTES.parentLog} variant="highlight" fullWidth>
              Manage appointments
            </LinkButton>
          </Stack>
        </SectionCard>
      </Stack>
    </SummaryContainer>
  );
}
