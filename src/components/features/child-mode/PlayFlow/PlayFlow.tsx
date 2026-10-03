"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Companion } from "@/components/features/companion";
import { ExerciseFigure, MissionConfirmation } from "@/components/features/missions";
import { Button, Chip, Heading, RingTimer, Screen, Stack, Text } from "@/components/ui";
import { ROUTES } from "@/config/app";
import { PLAY_GAMES, type PlayGame, type PlayLevel, type PlayMode } from "@/content/games";
import { useAppState } from "@/hooks/useAppState";
import { useCountdown } from "@/hooks/useCountdown";
import { todayKey } from "@/lib/dates";
import type {
  MissionCompany,
  MissionConfirmation as ConfirmationKind,
  MissionLog,
  MissionMoodAfter,
  MissionMoodBefore,
  MissionStep,
} from "@/types";
import { getCoinsForPlay, getMatchingPlayGames, toMoveKey } from "./game-matching";
import {
  BackButton,
  ChestBodyPath,
  ChestBandPath,
  ChestClaspRect,
  ChestContainer,
  ChestGlowPolygon,
  ChestGoldGlowEllipse,
  ChestInside,
  ChestLidPath,
  ChestSparklePolygon,
  ChestSubline,
  ChestSvg,
  ChoiceButton,
  ChoiceDot,
  ChoiceGrid,
  ChoiceSubtitle,
  ChoiceTitle,
  CoinBadge,
  CoinCircle,
  CoinInnerCircle,
  CoinLetter,
  CoinRewardAmount,
  CoinSvg,
  CompanionBox,
  ConfirmationWrapper,
  DotsRow,
  ExerciseActionsRow,
  ExerciseBox,
  ExerciseFigureBox,
  ExerciseStepTextBox,
  ExerciseTimerBox,
  GameActionsRow,
  GameBadgeRow,
  GameCard,
  PlayContainer,
  PlayHeadingBox,
  PlayStage,
  PlayTopBar,
  RestNowButton,
  StepIndicator,
} from "./PlayFlow.style";

export type PlayStep =
  "who" | "feeling" | "pick" | "exercise" | "confirmation" | "moodAfter" | "chest";

export type PlayFlowProps = {
  initialStep?: PlayStep;
  initialCompany?: MissionCompany;
  initialLevel?: PlayLevel;
  initialGame?: PlayGame;
};

function OpenChest() {
  return (
    <ChestSvg viewBox="0 0 200 160" role="img" aria-label="Open treasure chest full of coins">
      <ChestGlowPolygon points="100,60 40,0 160,0" />
      <ChestGlowPolygon points="100,60 10,30 50,0" />
      <ChestGlowPolygon points="100,60 190,30 150,0" />

      <ChestInside d="M 40 70 L 160 70 L 150 92 L 50 92 Z" />
      <ChestGoldGlowEllipse cx="100" cy="85" rx="45" ry="12" />

      <ChestSparklePolygon points="65,40 68,48 76,50 68,52 65,60 62,52 54,50 62,48" />
      <ChestSparklePolygon points="135,35 138,43 146,45 138,47 135,55 132,47 124,45 132,43" />
      <ChestSparklePolygon points="100,20 102,26 108,28 102,30 100,36 98,30 92,28 98,26" />

      <ChestLidPath d="M 35 45 Q 100 16 165 45 L 160 68 Q 100 42 40 68 Z" />
      <ChestBodyPath d="M 38 82 L 162 82 L 152 144 L 48 144 Z" />

      <ChestBandPath d="M 68 82 L 72 144" />
      <ChestBandPath d="M 132 82 L 128 144" />

      <ChestClaspRect x="93" y="80" width="14" height="16" rx="3" />
    </ChestSvg>
  );
}

function CoinIcon() {
  return (
    <CoinSvg viewBox="0 0 32 32" aria-hidden="true">
      <CoinCircle cx="16" cy="16" r="14" />
      <CoinInnerCircle cx="16" cy="16" r="11" />
      <CoinLetter x="16" y="16">
        C
      </CoinLetter>
    </CoinSvg>
  );
}

type StepCountdownProps = {
  step: MissionStep;
  stepIndex: number;
  totalSteps: number;
  withAdult: boolean;
  onNext: () => void;
  onRestNow: () => void;
};

function StepCountdown({
  step,
  stepIndex,
  totalSteps,
  withAdult,
  onNext,
  onRestNow,
}: StepCountdownProps) {
  const countdown = useCountdown({
    seconds: step.durationSeconds,
    running: true,
  });

  return (
    <ExerciseBox>
      <ExerciseFigureBox>
        <ExerciseFigure
          move={toMoveKey(step.poseKey)}
          withAdult={withAdult}
          label={step.text}
          size={220}
        />
      </ExerciseFigureBox>

      <ExerciseStepTextBox>
        <Heading level={3}>{step.text}</Heading>
      </ExerciseStepTextBox>

      <ExerciseTimerBox>
        <RingTimer
          remaining={countdown.remaining}
          progress={countdown.progress}
          label={`Step ${stepIndex + 1} of ${totalSteps}`}
          size={160}
        />
      </ExerciseTimerBox>

      <ExerciseActionsRow>
        <Button variant="primary" fullWidth onClick={onNext}>
          {stepIndex < totalSteps - 1 ? "Next step" : "Done"}
        </Button>
        <RestNowButton type="button" onClick={onRestNow}>
          Rest now
        </RestNowButton>
      </ExerciseActionsRow>
    </ExerciseBox>
  );
}

export function PlayFlow({
  initialStep = "who",
  initialCompany = "alone",
  initialLevel = 1,
  initialGame,
}: PlayFlowProps) {
  const router = useRouter();
  const { state, actions, isReady } = useAppState();

  const [step, setStep] = useState<PlayStep>(initialStep);
  const [company, setCompany] = useState<MissionCompany>(initialCompany);
  const [level, setLevel] = useState<PlayLevel>(initialLevel);
  const [moodBefore, setMoodBefore] = useState<MissionMoodBefore | undefined>(undefined);
  const [gameIndex, setGameIndex] = useState(0);
  const [exerciseStepIndex, setExerciseStepIndex] = useState(0);
  const [isRest, setIsRest] = useState(false);
  const [confirmedBy, setConfirmedBy] = useState<ConfirmationKind | undefined>(undefined);
  const [, setMoodAfter] = useState<MissionMoodAfter | undefined>(undefined);

  const hasSavedRef = useRef(false);

  const gameMode: PlayMode = company === "alone" ? "alone" : "family";
  const matchingGames = useMemo(
    () => getMatchingPlayGames(gameMode, level, PLAY_GAMES),
    [gameMode, level],
  );

  const selectedGame: PlayGame =
    initialGame ?? matchingGames[gameIndex % Math.max(1, matchingGames.length)] ?? PLAY_GAMES[0];

  const handleSelectCompany = (choice: MissionCompany) => {
    setCompany(choice);
    setStep("feeling");
  };

  const handleSelectFeeling = (lvl: PlayLevel, mood: MissionMoodBefore) => {
    setLevel(lvl);
    setMoodBefore(mood);
    setGameIndex(0);
    setStep("pick");
  };

  const handleAnotherGame = () => {
    setGameIndex((prev) => (prev + 1) % matchingGames.length);
  };

  const handleStartGame = () => {
    setExerciseStepIndex(0);
    setIsRest(false);
    setStep("exercise");
  };

  const handleNextExerciseStep = () => {
    if (selectedGame && exerciseStepIndex < selectedGame.steps.length - 1) {
      setExerciseStepIndex((prev) => prev + 1);
    } else {
      setIsRest(false);
      setStep("confirmation");
    }
  };

  const handleRestNow = () => {
    setIsRest(true);
    setConfirmedBy("child");
    setStep("moodAfter");
  };

  const handleConfirmationConfirm = (how: ConfirmationKind) => {
    setConfirmedBy(how);
    setIsRest(false);
    setStep("moodAfter");
  };

  const handleConfirmationStop = () => {
    setIsRest(true);
    setConfirmedBy("child");
    setStep("moodAfter");
  };

  const handleSelectMoodAfter = (mood: MissionMoodAfter) => {
    setMoodAfter(mood);

    if (!hasSavedRef.current && selectedGame) {
      hasSavedRef.current = true;
      const log: MissionLog = {
        id: crypto.randomUUID(),
        date: todayKey(),
        missionId: selectedGame.id,
        status: isRest ? "rest" : "completed",
        company,
        confirmedBy: isRest ? "child" : (confirmedBy ?? "child"),
        createdAt: new Date().toISOString(),
        moodBefore,
        moodAfter: mood,
      };
      actions.addMissionLog(log);
    }

    setStep("chest");
  };

  const handleBack = () => {
    switch (step) {
      case "who":
        router.push(ROUTES.home);
        break;
      case "feeling":
        setStep("who");
        break;
      case "pick":
        setStep("feeling");
        break;
      case "exercise":
        if (exerciseStepIndex > 0) {
          setExerciseStepIndex((prev) => prev - 1);
        } else {
          setStep("pick");
        }
        break;
      case "confirmation":
        setStep("exercise");
        break;
      case "moodAfter":
        if (isRest) {
          setStep("exercise");
        } else {
          setStep("confirmation");
        }
        break;
      case "chest":
        router.push(ROUTES.home);
        break;
    }
  };

  if (!isReady) {
    return (
      <Screen>
        <PlayContainer>
          <Text tone="muted">Loading play flow...</Text>
        </PlayContainer>
      </Screen>
    );
  }

  const companionElement = (
    <CompanionBox>
      <Companion
        pose="cheer"
        size="sm"
        equippedItemIds={state.companion.equippedItemIds}
        name={state.child?.nickname || "Your companion"}
      />
    </CompanionBox>
  );

  return (
    <Screen>
      <PlayContainer>
        <PlayTopBar>
          <BackButton type="button" onClick={handleBack} aria-label="Go back">
            ← Back
          </BackButton>
          {step === "exercise" && selectedGame ? (
            <StepIndicator>
              Step {exerciseStepIndex + 1} of {selectedGame.steps.length}
            </StepIndicator>
          ) : null}
        </PlayTopBar>

        {/* Step 1: Who plays */}
        {step === "who" ? (
          <PlayStage>
            {companionElement}

            <PlayHeadingBox>
              <Heading level={1}>Who is playing?</Heading>
              <Text tone="muted">Choose who joins you for today&apos;s game.</Text>
            </PlayHeadingBox>

            <ChoiceGrid>
              <ChoiceButton
                type="button"
                onClick={() => handleSelectCompany("alone")}
                aria-label="Alone, play on your own"
              >
                <ChoiceTitle>Alone</ChoiceTitle>
                <ChoiceSubtitle>Play on your own</ChoiceSubtitle>
              </ChoiceButton>

              <ChoiceButton
                type="button"
                onClick={() => handleSelectCompany("family")}
                aria-label="Family, play with a parent or carer"
              >
                <ChoiceTitle>Family</ChoiceTitle>
                <ChoiceSubtitle>Play with a parent or carer</ChoiceSubtitle>
              </ChoiceButton>

              <ChoiceButton
                type="button"
                onClick={() => handleSelectCompany("other")}
                aria-label="Someone else, play with a friend or partner"
              >
                <ChoiceTitle>Someone else</ChoiceTitle>
                <ChoiceSubtitle>Play with a friend or partner</ChoiceSubtitle>
              </ChoiceButton>
            </ChoiceGrid>
          </PlayStage>
        ) : null}

        {/* Step 2: How are you feeling? */}
        {step === "feeling" ? (
          <PlayStage>
            {companionElement}

            <PlayHeadingBox>
              <Heading level={1}>How are you feeling?</Heading>
              <Text tone="muted">Pick the pace that fits your energy today.</Text>
            </PlayHeadingBox>

            <ChoiceGrid>
              <ChoiceButton
                type="button"
                onClick={() => handleSelectFeeling(1, "calm")}
                aria-label="Calm, level 1"
              >
                <ChoiceTitle>Calm</ChoiceTitle>
                <DotsRow aria-hidden="true">
                  <ChoiceDot $active={true} />
                </DotsRow>
              </ChoiceButton>

              <ChoiceButton
                type="button"
                onClick={() => handleSelectFeeling(2, "strong")}
                aria-label="Strong, level 2"
              >
                <ChoiceTitle>Strong</ChoiceTitle>
                <DotsRow aria-hidden="true">
                  <ChoiceDot $active={true} />
                  <ChoiceDot $active={true} />
                </DotsRow>
              </ChoiceButton>

              <ChoiceButton
                type="button"
                onClick={() => handleSelectFeeling(3, "amazing")}
                aria-label="Amazing, level 3"
              >
                <ChoiceTitle>Amazing</ChoiceTitle>
                <DotsRow aria-hidden="true">
                  <ChoiceDot $active={true} />
                  <ChoiceDot $active={true} />
                  <ChoiceDot $active={true} />
                </DotsRow>
              </ChoiceButton>
            </ChoiceGrid>
          </PlayStage>
        ) : null}

        {/* Step 3: Pick one game */}
        {step === "pick" && selectedGame ? (
          <PlayStage>
            <PlayHeadingBox>
              <Heading level={1}>Ready to play?</Heading>
              <Text tone="muted">Here is a gentle game picked for you.</Text>
            </PlayHeadingBox>

            <GameCard>
              <GameBadgeRow>
                <Chip label={company === "alone" ? "Alone" : "With someone"} tone="primary" />
                <Chip label={`Level ${level}`} tone="default" />
                <Chip label={`${selectedGame.steps.length} steps`} tone="default" />
              </GameBadgeRow>

              <Stack gap="xs" align="center">
                <Heading level={2}>{selectedGame.title}</Heading>
                <Text tone="muted">{selectedGame.parentNote}</Text>
              </Stack>

              <GameActionsRow>
                <Button variant="primary" fullWidth onClick={handleStartGame}>
                  Let&apos;s play
                </Button>
                <Button variant="secondary" fullWidth onClick={handleAnotherGame}>
                  Another game
                </Button>
              </GameActionsRow>
            </GameCard>
          </PlayStage>
        ) : null}

        {/* Step 4: Exercise */}
        {step === "exercise" && selectedGame ? (
          <PlayStage>
            <Stack gap="xs" align="center">
              <Heading level={2}>{selectedGame.title}</Heading>
            </Stack>

            <StepCountdown
              key={exerciseStepIndex}
              step={selectedGame.steps[exerciseStepIndex]}
              stepIndex={exerciseStepIndex}
              totalSteps={selectedGame.steps.length}
              withAdult={company === "family" || company === "other"}
              onNext={handleNextExerciseStep}
              onRestNow={handleRestNow}
            />
          </PlayStage>
        ) : null}

        {/* Step 5: Confirmation */}
        {step === "confirmation" ? (
          <PlayStage>
            <ConfirmationWrapper>
              <MissionConfirmation
                company={company}
                parentSettings={state.settings}
                isDemo={state.isDemo}
                onConfirm={handleConfirmationConfirm}
                onStop={handleConfirmationStop}
              />
            </ConfirmationWrapper>
          </PlayStage>
        ) : null}

        {/* Step 6: How do you feel after playing? */}
        {step === "moodAfter" ? (
          <PlayStage>
            {companionElement}

            <PlayHeadingBox>
              <Heading level={1}>How do you feel after playing?</Heading>
              <Text tone="muted">Every answer is completely fine!</Text>
            </PlayHeadingBox>

            <ChoiceGrid>
              <ChoiceButton
                type="button"
                onClick={() => handleSelectMoodAfter("exhausted")}
                aria-label="Exhausted"
              >
                <ChoiceTitle>Exhausted</ChoiceTitle>
              </ChoiceButton>

              <ChoiceButton
                type="button"
                onClick={() => handleSelectMoodAfter("chill")}
                aria-label="Chill"
              >
                <ChoiceTitle>Chill</ChoiceTitle>
              </ChoiceButton>

              <ChoiceButton
                type="button"
                onClick={() => handleSelectMoodAfter("great")}
                aria-label="Great"
              >
                <ChoiceTitle>Great</ChoiceTitle>
              </ChoiceButton>
            </ChoiceGrid>
          </PlayStage>
        ) : null}

        {/* Step 7: Chest */}
        {step === "chest" ? (
          <PlayStage>
            {companionElement}

            <ChestContainer>
              <OpenChest />

              <CoinBadge>
                <CoinIcon />
                <CoinRewardAmount>
                  +{getCoinsForPlay(isRest ? "rest" : "completed")}
                </CoinRewardAmount>
              </CoinBadge>

              <ChestSubline>Every time you play, you get a chest.</ChestSubline>

              <Button variant="primary" fullWidth onClick={() => router.push(ROUTES.home)}>
                Back home
              </Button>
            </ChestContainer>
          </PlayStage>
        ) : null}
      </PlayContainer>
    </Screen>
  );
}
