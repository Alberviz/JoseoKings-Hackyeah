"use client";

import { useState } from "react";
import { Companion } from "@/components/features/companion";
import { Button, Heading, LinkButton, Screen, Stack, Text } from "@/components/ui";
import { DISCOMFORT_THRESHOLD, QUESTION_IDS } from "@/config/content-ids";
import { ROUTES } from "@/config/app";
import { CHECK_IN_QUESTIONS } from "@/content/check-in-questions";
import { CHILD_VISIBILITY_NOTE } from "@/content/disclaimers";
import { useAppState } from "@/hooks/useAppState";
import { todayKey } from "@/lib/dates";
import type { CheckIn, CheckInAnswer, CheckInOption, CheckInQuestion } from "@/types";
import {
  ChoiceGameButton,
  ChoiceIconBadge,
  ChoicesGrid,
  ChoiceText,
  EndCelebrationBox,
  GameActions,
  GameStage,
  NavSpacer,
  NextStepRow,
  ParentReportNotice,
  PetContainer,
  PetGlow,
  PetNameBadge,
  PetRoom,
  ProgressHeader,
  ProgressLabel,
  ProgressTrack,
  ProgressFill,
  RestTodayButton,
  SelectedChoiceNote,
  SpeechBubble,
  SpeechHint,
  SpeechText,
  StarsBadge,
} from "./CheckInScreen.style";

const ICON_MAP: Record<string, string> = {
  "belly-calm": "OK",
  "belly-rumble": "~",
  "belly-sore": "!",
  "energy-high": "+++",
  "energy-medium": "++",
  "energy-low": "+",
  "play-active": ">>",
  "play-breaks": "<>",
  "play-resting": "..",
};

function skippedAnswers(questions: CheckInQuestion[]): Record<string, CheckInAnswer> {
  return Object.fromEntries(questions.map((q) => [q.id, "skipped" as const]));
}

type CheckInScreenProps = {
  questions?: CheckInQuestion[];
  onComplete?: (checkIn: CheckIn) => void;
};

export function CheckInScreen({ questions = CHECK_IN_QUESTIONS, onComplete }: CheckInScreenProps) {
  const { state, actions, isReady } = useAppState();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, CheckInAnswer>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [notToday, setNotToday] = useState(false);
  const [companionPose, setCompanionPose] = useState<"idle" | "cheer">("idle");

  const companionName = state.companion.name || "Your companion";
  const currentQuestion = questions[currentStep];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const selectedOption = currentQuestion?.options.find((o) => o.value === selectedAnswer);
  const progressPercent =
    questions.length === 0 ? 0 : Math.round(((currentStep + 1) / questions.length) * 100);

  const saveCheckIn = (finalAnswers: Record<string, CheckInAnswer>, skipped: boolean) => {
    const checkInRecord: CheckIn = {
      id: crypto.randomUUID(),
      date: todayKey(),
      answers: finalAnswers,
      notToday: skipped,
      createdAt: new Date().toISOString(),
    };

    actions.addCheckIn(checkInRecord);

    if (onComplete) {
      onComplete(checkInRecord);
    }

    setIsCompleted(true);
  };

  const handleSelectOption = (optionValue: number) => {
    if (!currentQuestion) return;

    // Cheer for the act of answering, never for the value chosen.
    setCompanionPose("cheer");
    setAnswers({
      ...answers,
      [currentQuestion.id]: optionValue,
    });

    window.setTimeout(() => {
      setCompanionPose("idle");
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
    saveCheckIn(skippedAnswers(questions), true);
  };

  const bellyAnswer = answers[QUESTION_IDS.bellyComfort];
  const hasDiscomfortReported =
    typeof bellyAnswer === "number" && bellyAnswer >= DISCOMFORT_THRESHOLD;

  if (!isReady) {
    return (
      <Screen>
        <GameStage>
          <Text tone="muted">Loading check-in...</Text>
        </GameStage>
      </Screen>
    );
  }

  if (isCompleted) {
    return (
      <Screen>
        <GameStage>
          <EndCelebrationBox>
            <StarsBadge aria-hidden="true">*</StarsBadge>
            <Companion
              pose="cheer"
              size="lg"
              name={companionName}
              equippedItemIds={state.companion.equippedItemIds}
            />
            <Stack gap="sm">
              <Heading level={1}>{notToday ? "Care day saved" : "Check-in saved"}</Heading>
              <Text tone="muted">
                {notToday
                  ? "Resting is okay. Your companion is still with you."
                  : "Thanks for checking in. Every answer gives the same reward."}
              </Text>
            </Stack>

            {hasDiscomfortReported && !notToday && (
              <ParentReportNotice role="status">
                <Heading level={3}>What your parents can see</Heading>
                <Text tone="muted">{CHILD_VISIBILITY_NOTE}</Text>
              </ParentReportNotice>
            )}

            <LinkButton href={ROUTES.home} variant="primary" fullWidth>
              Back home
            </LinkButton>
          </EndCelebrationBox>
        </GameStage>
      </Screen>
    );
  }

  if (!currentQuestion) {
    return (
      <Screen>
        <GameStage>
          <Text>No check-in questions yet.</Text>
          <LinkButton href={ROUTES.home} variant="secondary">
            Back home
          </LinkButton>
        </GameStage>
      </Screen>
    );
  }

  return (
    <Screen>
      <GameStage>
        <ProgressHeader aria-label={`Question ${currentStep + 1} of ${questions.length}`}>
          <ProgressLabel>
            Question {currentStep + 1} of {questions.length}
          </ProgressLabel>
          <ProgressTrack>
            <ProgressFill $percent={progressPercent} />
          </ProgressTrack>
        </ProgressHeader>

        <PetRoom>
          <PetGlow />
          <PetContainer $cheer={companionPose === "cheer"}>
            <Companion
              pose={companionPose}
              size="lg"
              name={companionName}
              equippedItemIds={state.companion.equippedItemIds}
            />
            <PetNameBadge>{companionName}</PetNameBadge>
          </PetContainer>
        </PetRoom>

        <SpeechBubble>
          <SpeechText>{currentQuestion.prompt}</SpeechText>
          <SpeechHint>Tap one choice. Every choice gives the same reward.</SpeechHint>
        </SpeechBubble>

        <ChoicesGrid role="radiogroup" aria-label={currentQuestion.prompt}>
          {currentQuestion.options.map((option: CheckInOption) => {
            const isSelected = selectedAnswer === option.value;
            const iconChar = ICON_MAP[option.iconKey] || "*";

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

        {selectedOption ? (
          <SelectedChoiceNote role="status">You chose: {selectedOption.label}</SelectedChoiceNote>
        ) : null}

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
              {currentStep < questions.length - 1 ? "Next question" : "Save today's check-in"}
            </Button>
          </NextStepRow>

          <RestTodayButton type="button" onClick={handleSkipToday}>
            I don&apos;t feel like it today
          </RestTodayButton>
        </GameActions>
      </GameStage>
    </Screen>
  );
}
