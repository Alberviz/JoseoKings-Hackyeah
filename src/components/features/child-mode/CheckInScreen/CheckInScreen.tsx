"use client";

import { useState } from "react";
import { Companion } from "@/components/features/companion";
import { Button, Heading, LinkButton, ProgressBar, Screen, Stack, Text } from "@/components/ui";
import { ROUTES } from "@/config/app";
import { CHECK_IN_QUESTIONS } from "@/content/check-in-questions";
import { useAppState } from "@/hooks/useAppState";
import { todayKey } from "@/lib/dates";
import type { CheckIn, CheckInAnswer, CheckInOption, CheckInQuestion } from "@/types";
import { CheckInIcon, CheckInStar, CheckInTick } from "../CheckInIcons";
import {
  BackArrow,
  BackButton,
  CheckInContainer,
  ChoiceGameButton,
  ChoiceIconBadge,
  ChoicesGrid,
  ChoiceText,
  ChoiceTickSlot,
  EndCelebrationBox,
  GameActions,
  LoadingBox,
  PetContainer,
  PetNameBadge,
  PetRoom,
  ProgressHeader,
  ProgressLabel,
  ProgressTopRow,
  RestTodayButton,
  SelectedChoiceNote,
  SpeechBubble,
  SpeechHint,
  SpeechText,
  StarsBadge,
  TopRowSpacer,
} from "./CheckInScreen.style";

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

  if (!isReady) {
    return (
      <Screen>
        <LoadingBox>
          <Text tone="muted">Loading check-in...</Text>
        </LoadingBox>
      </Screen>
    );
  }

  if (isCompleted) {
    return (
      <Screen>
        <CheckInContainer>
          <EndCelebrationBox>
            <StarsBadge>
              <CheckInStar />
            </StarsBadge>
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

            <LinkButton href={ROUTES.home} variant="primary" fullWidth>
              Back home
            </LinkButton>
          </EndCelebrationBox>
        </CheckInContainer>
      </Screen>
    );
  }

  if (!currentQuestion) {
    return (
      <Screen>
        <CheckInContainer>
          <Text>No check-in questions yet.</Text>
          <LinkButton href={ROUTES.home} variant="secondary">
            Back home
          </LinkButton>
        </CheckInContainer>
      </Screen>
    );
  }

  return (
    <Screen>
      <CheckInContainer>
        <ProgressHeader aria-label={`Question ${currentStep + 1} of ${questions.length}`}>
          <ProgressTopRow>
            {currentStep > 0 ? (
              <BackButton type="button" onClick={handleBack}>
                <BackArrow aria-hidden="true">&#8592;</BackArrow>
                Previous
              </BackButton>
            ) : (
              <TopRowSpacer aria-hidden="true" />
            )}
            <ProgressLabel>
              Question {currentStep + 1} of {questions.length}
            </ProgressLabel>
          </ProgressTopRow>
          <ProgressBar
            value={currentStep + 1}
            max={questions.length}
            label={`Check-in progress, question ${currentStep + 1} of ${questions.length}`}
          />
        </ProgressHeader>

        <PetRoom>
          <PetContainer $cheer={companionPose === "cheer"}>
            <Companion
              pose={companionPose}
              size="sm"
              name={companionName}
              equippedItemIds={state.companion.equippedItemIds}
            />
            <PetNameBadge>{companionName}</PetNameBadge>
          </PetContainer>

          <SpeechBubble>
            <SpeechText>{currentQuestion.prompt}</SpeechText>
            <SpeechHint>Tap one choice. Every choice gives the same reward.</SpeechHint>
          </SpeechBubble>
        </PetRoom>

        <ChoicesGrid role="radiogroup" aria-label={currentQuestion.prompt}>
          {currentQuestion.options.map((option: CheckInOption) => {
            const isSelected = selectedAnswer === option.value;

            return (
              <ChoiceGameButton
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                $isSelected={isSelected}
                onClick={() => handleSelectOption(option.value)}
              >
                <ChoiceIconBadge aria-hidden="true">
                  <CheckInIcon iconKey={option.iconKey} />
                </ChoiceIconBadge>
                <ChoiceText>{option.label}</ChoiceText>
                <ChoiceTickSlot aria-hidden="true">
                  {isSelected ? <CheckInTick /> : null}
                </ChoiceTickSlot>
              </ChoiceGameButton>
            );
          })}
        </ChoicesGrid>

        {selectedOption ? (
          <SelectedChoiceNote role="status">You chose: {selectedOption.label}</SelectedChoiceNote>
        ) : null}

        <GameActions>
          <Button
            type="button"
            variant="primary"
            fullWidth
            disabled={selectedAnswer === undefined}
            onClick={handleNext}
          >
            {currentStep < questions.length - 1 ? "Next question" : "Save today's check-in"}
          </Button>

          <RestTodayButton type="button" onClick={handleSkipToday}>
            I don&apos;t feel like it today
          </RestTodayButton>
        </GameActions>
      </CheckInContainer>
    </Screen>
  );
}
