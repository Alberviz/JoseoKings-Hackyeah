"use client";

import { useState } from "react";
import { Button, Heading, LinkButton, Screen, Stack, Text } from "@/components/ui";
import { ROUTES } from "@/config/app";
import type { CheckIn, CheckInAnswer, CheckInOption, CheckInQuestion } from "@/types";
import {
  ChoiceGameButton,
  ChoiceIconBadge,
  ChoicesGrid,
  ChoiceText,
  EndCelebrationBox,
  GameActions,
  GameStage,
  GameStatusHeader,
  MeterBarFill,
  MeterBarTrack,
  MeterButton,
  MeterIcon,
  MeterLabel,
  NavSpacer,
  NextStepRow,
  ParentReportNotice,
  PetAvatarFace,
  PetCheek,
  PetCheeksRow,
  PetContainer,
  PetEye,
  PetEyesRow,
  PetGlow,
  PetMouth,
  PetNameBadge,
  PetRoom,
  RestTodayButton,
  SpeechBubble,
  SpeechHint,
  SpeechText,
  StarsBadge,
} from "./CheckInScreen.style";
import { POU_CHECKIN_QUESTIONS } from "./questions";

const METER_CONFIG: Array<{ id: string; label: string; icon: string; color: string }> = [
  { id: "belly_comfort", label: "Tummy", icon: "💚", color: "#1E7A46" },
  { id: "energy_level", label: "Battery", icon: "⚡", color: "#F2B705" },
  { id: "daily_pace", label: "Play", icon: "🎮", color: "#5B3FA8" },
];

const ICON_MAP: Record<string, string> = {
  calm: "🟢",
  uneasy: "🟡",
  hurting: "🔴",
  battery_full: "🔋",
  battery_half: "🪫",
  battery_low: "⚡",
  pace_steady: "🏃",
  pace_paused: "🚶",
  pace_stopped: "🛋️",
};

function answerToPercent(val: CheckInAnswer | undefined): number {
  if (val === undefined || val === "skipped") return 0;
  if (val === 0) return 100;
  if (val === 1) return 55;
  return 25;
}

interface CheckInScreenProps {
  questions?: CheckInQuestion[];
  onComplete?: (checkIn: CheckIn) => void;
}

export function CheckInScreen({
  questions = POU_CHECKIN_QUESTIONS,
  onComplete,
}: CheckInScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, CheckInAnswer>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [notToday, setNotToday] = useState(false);
  const [petMood, setPetMood] = useState<"happy" | "calm" | "resting">("calm");

  const currentQuestion = questions[currentStep];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const saveCheckIn = (finalAnswers: Record<string, CheckInAnswer>, skipped: boolean) => {
    const todayKey = new Date().toISOString().split("T")[0];
    const checkInRecord: CheckIn = {
      id: crypto.randomUUID(),
      date: todayKey,
      answers: finalAnswers,
      notToday: skipped,
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = localStorage.getItem("crohncare_checkins");
      const list: CheckIn[] = existing ? JSON.parse(existing) : [];
      list.push(checkInRecord);
      localStorage.setItem("crohncare_checkins", JSON.stringify(list));
    } catch {
      // Storage blocked or unavailable
    }

    if (onComplete) {
      onComplete(checkInRecord);
    }

    setIsCompleted(true);
  };

  const handleSelectOption = (optionValue: number) => {
    if (!currentQuestion) return;

    setPetMood("happy");
    const updated = {
      ...answers,
      [currentQuestion.id]: optionValue,
    };
    setAnswers(updated);

    setTimeout(() => {
      setPetMood("calm");
    }, 1200);
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      saveCheckIn(answers, false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkipToday = () => {
    setNotToday(true);
    saveCheckIn(answers, true);
  };

  const hasDiscomfortReported = Object.values(answers).some(
    (ans) => typeof ans === "number" && ans > 0,
  );

  if (isCompleted) {
    return (
      <Screen>
        <GameStage>
          <EndCelebrationBox>
            <StarsBadge aria-hidden="true">🌟✨🐾</StarsBadge>
            <Stack gap="sm">
              <Heading level={1}>{notToday ? "Care Day Saved!" : "Meters Recharged!"}</Heading>
              <Text tone="muted">
                {notToday
                  ? "Taking rest is just as important. Your companion is here with you."
                  : "All your meters are updated for today. Great job keeping your companion active!"}
              </Text>
            </Stack>

            {hasDiscomfortReported && !notToday && (
              <ParentReportNotice role="status">
                <Heading level={3}>What your parents can see</Heading>
                <Text tone="muted">
                  Your parents will see that your tummy felt sensitive or your battery was low, so
                  they can take good care of you.
                </Text>
              </ParentReportNotice>
            )}

            <LinkButton href={ROUTES.home} variant="primary" fullWidth>
              Back to Companion
            </LinkButton>
          </EndCelebrationBox>
        </GameStage>
      </Screen>
    );
  }

  return (
    <Screen>
      <GameStage>
        {/* Pou-style top status meters */}
        <GameStatusHeader aria-label="Companion status meters">
          {METER_CONFIG.map((meter, idx) => {
            const val = answers[meter.id];
            const pct = answerToPercent(val);
            const isActive = currentStep === idx;
            const isFilled = val !== undefined;

            return (
              <MeterButton
                key={meter.id}
                type="button"
                $isActive={isActive}
                $isFilled={isFilled}
                onClick={() => setCurrentStep(idx)}
                aria-label={`${meter.label} meter: ${pct}%`}
              >
                <MeterLabel>
                  <MeterIcon aria-hidden="true">{meter.icon}</MeterIcon> {meter.label}
                </MeterLabel>
                <MeterBarTrack>
                  <MeterBarFill $percent={pct} $color={meter.color} />
                </MeterBarTrack>
              </MeterButton>
            );
          })}
        </GameStatusHeader>

        {/* Center Pet Room with interactive character */}
        <PetRoom>
          <PetGlow />
          <PetContainer
            $cheer={petMood === "happy"}
            onClick={() => setPetMood((prev) => (prev === "happy" ? "calm" : "happy"))}
            role="img"
            aria-label="Your friendly companion"
          >
            <PetAvatarFace $mood={petMood}>
              <PetEyesRow>
                <PetEye />
                <PetEye />
              </PetEyesRow>
              <PetCheeksRow>
                <PetCheek />
                <PetCheek />
              </PetCheeksRow>
              <PetMouth $mood={petMood} />
            </PetAvatarFace>
            <PetNameBadge>Capy</PetNameBadge>
          </PetContainer>
        </PetRoom>

        {/* Pet Speech Bubble with the current check-in indicator */}
        <SpeechBubble>
          <SpeechText>{currentQuestion.prompt}</SpeechText>
          <SpeechHint>Tap a choice to update your companion’s meter</SpeechHint>
        </SpeechBubble>

        {/* Game Choices */}
        <ChoicesGrid role="radiogroup" aria-label={currentQuestion.prompt}>
          {currentQuestion.options.map((option: CheckInOption) => {
            const isSelected = selectedAnswer === option.value;
            const iconChar = ICON_MAP[option.iconKey] || "✨";

            return (
              <ChoiceGameButton
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                $isSelected={isSelected}
                onClick={() => handleSelectOption(option.value)}
              >
                <ChoiceIconBadge aria-hidden="true">{iconChar}</ChoiceIconBadge>
                <ChoiceText>{option.label}</ChoiceText>
              </ChoiceGameButton>
            );
          })}
        </ChoicesGrid>

        {/* Game navigation footer */}
        <GameActions>
          <NextStepRow>
            {currentStep > 0 ? (
              <Button type="button" variant="secondary" onClick={handleBack}>
                Previous
              </Button>
            ) : (
              <NavSpacer aria-hidden="true" />
            )}

            <Button
              type="button"
              variant="primary"
              disabled={selectedAnswer === undefined}
              onClick={handleNext}
            >
              {currentStep < questions.length - 1 ? "Next meter" : "Save today's check-in"}
            </Button>
          </NextStepRow>

          <RestTodayButton type="button" onClick={handleSkipToday}>
            Today I&apos;d rather just rest
          </RestTodayButton>
        </GameActions>
      </GameStage>
    </Screen>
  );
}
