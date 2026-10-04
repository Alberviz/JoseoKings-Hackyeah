"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Companion } from "@/components/features/companion";
import { ExerciseFigure, MissionConfirmation } from "@/components/features/missions";
import { Button, Chip, Heading, RingTimer, Screen, Stack, Text } from "@/components/ui";
import { ROUTES } from "@/config/app";
import { PLAY_GAMES, type PlayGame, type PlayLevel, type PlayMode } from "@/content/games";
import { useAppState } from "@/hooks/useAppState";
import { useCountdown } from "@/hooks/useCountdown";

import { todayKey } from "@/lib/dates";
import { getDragonEvolution } from "@/lib/economy";
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
  ChestContainer,
  ChestGlowAura,
  ChestRasterImg,
  ChestSparklesOverlay,
  ChestSubline,
  ChestWrapper,
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
  SparkleStar,
  StepIndicator,
} from "./PlayFlow.style";

export type PlayStep =
  "who" | "feeling" | "pick" | "exercise" | "confirmation" | "moodAfter" | "chest";

export const AUTO_ADVANCE_DELAY_MS = 2000;

export type PlayFlowProps = {
  initialStep?: PlayStep;
  initialCompany?: MissionCompany;
  initialLevel?: PlayLevel;
  initialGame?: PlayGame;
  initialChestOpened?: boolean;
  autoAdvanceDelayMs?: number;
};

function playChestOpenSound() {
  try {
    if (typeof window === "undefined") return;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.38);
    });
  } catch {
    // Ignore audio errors gracefully
  }
}

function playChestTapSound() {
  try {
    if (typeof window === "undefined") return;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch {
    // Ignore audio errors gracefully
  }
}

function triggerChestHaptics() {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([35, 50, 90]);
    }
  } catch {
    // Ignore haptic failures
  }
}

type TreasureChestProps = {
  isOpen: boolean;
  onOpen: () => void;
};

function TreasureChest({ isOpen, onOpen }: TreasureChestProps) {
  const [isTapped, setIsTapped] = useState(false);

  const handleTap = () => {
    setIsTapped(true);
    setTimeout(() => setIsTapped(false), 600);

    if (!isOpen) {
      playChestOpenSound();
      triggerChestHaptics();
      onOpen();
    } else {
      playChestTapSound();
      triggerChestHaptics();
    }
  };

  return (
    <ChestWrapper
      type="button"
      aria-label={
        isOpen ? "Open treasure chest full of coins" : "Closed treasure chest. Tap to open!"
      }
      onClick={handleTap}
      $isOpen={isOpen}
      $isTapped={isTapped}
      data-testid="open-treasure-chest"
    >
      <ChestGlowAura $isOpen={isOpen} aria-hidden="true" />

      {isOpen ? (
        <ChestSparklesOverlay viewBox="0 0 200 200" aria-hidden="true">
          <SparkleStar
            d="M 40 45 Q 40 55 30 55 Q 40 55 40 65 Q 40 55 50 55 Q 40 55 40 45 Z"
            $delay={0.1}
          />
          <SparkleStar
            d="M 100 15 Q 100 27 88 27 Q 100 27 100 39 Q 100 27 112 27 Q 100 27 100 15 Z"
            $delay={0.25}
          />
          <SparkleStar
            d="M 160 40 Q 160 52 148 52 Q 160 52 160 64 Q 160 52 172 52 Q 160 52 160 40 Z"
            $delay={0.15}
          />
          <SparkleStar
            d="M 180 110 Q 180 120 170 120 Q 180 120 180 130 Q 180 120 190 120 Q 180 120 180 110 Z"
            $delay={0.35}
          />
          <SparkleStar
            d="M 20 100 Q 20 110 10 110 Q 20 110 20 120 Q 20 110 30 110 Q 20 110 20 100 Z"
            $delay={0.3}
          />
        </ChestSparklesOverlay>
      ) : null}

      <ChestRasterImg
        src={isOpen ? "/chest_open.png" : "/chest_closed.png"}
        alt=""
        role="img"
        aria-label={isOpen ? "Open treasure chest full of coins" : "Closed treasure chest"}
        $isOpen={isOpen}
        $isTapped={isTapped}
      />
    </ChestWrapper>
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
  autoAdvanceDelayMs?: number;
};

function StepCountdown({
  step,
  stepIndex,
  totalSteps,
  withAdult,
  onNext,
  onRestNow,
  autoAdvanceDelayMs = AUTO_ADVANCE_DELAY_MS,
}: StepCountdownProps) {
  const countdown = useCountdown({
    seconds: step.durationSeconds,
    running: true,
  });

  const onNextRef = useRef(onNext);
  useEffect(() => {
    onNextRef.current = onNext;
  });

  const onRestNowRef = useRef(onRestNow);
  useEffect(() => {
    onRestNowRef.current = onRestNow;
  });

  const nextCalledRef = useRef(false);

  const handleNext = useCallback(() => {
    if (nextCalledRef.current) return;
    nextCalledRef.current = true;
    onNextRef.current();
  }, []);

  const handleRest = useCallback(() => {
    nextCalledRef.current = true;
    onRestNowRef.current();
  }, []);

  useEffect(() => {
    if (!countdown.isDone) return;

    const timer = setTimeout(() => {
      handleNext();
    }, autoAdvanceDelayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [countdown.isDone, handleNext, autoAdvanceDelayMs]);

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
        {!countdown.isDone && countdown.remaining <= 5 && (
          <Text tone="muted" size="sm">
            Almost there!
          </Text>
        )}
        <Button
          variant="primary"
          fullWidth
          onClick={handleNext}
          disabled={!countdown.isDone}
          aria-disabled={!countdown.isDone}
          data-testid="play-step-next-button"
        >
          {stepIndex < totalSteps - 1 ? "Next step" : "Done"}
        </Button>
        <RestNowButton type="button" onClick={handleRest}>
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
  initialChestOpened = false,
  autoAdvanceDelayMs = AUTO_ADVANCE_DELAY_MS,
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
  const [isChestOpened, setIsChestOpened] = useState(initialChestOpened);

  const hasSavedRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);

  const handleOpenChest = () => {
    setIsChestOpened(true);
  };

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
    startedAtRef.current = Date.now();
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
        equippedItemIds={
          state.economy?.equippedItemIds?.length
            ? state.economy.equippedItemIds
            : state.companion.equippedItemIds
        }
        name={state.child?.nickname || "Your companion"}
        stage={getDragonEvolution(state.economy ?? { fire: 0 }).stage}
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
              autoAdvanceDelayMs={autoAdvanceDelayMs}
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
              <TreasureChest isOpen={isChestOpened} onOpen={handleOpenChest} />

              {isChestOpened ? (
                <>
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
                </>
              ) : (
                <>
                  <ChestSubline>Tap the chest to open your reward!</ChestSubline>

                  <Button variant="primary" fullWidth onClick={handleOpenChest}>
                    Open chest!
                  </Button>
                </>
              )}
            </ChestContainer>
          </PlayStage>
        ) : null}
      </PlayContainer>
    </Screen>
  );
}
