"use client";

import { useEffect, useRef, useState } from "react";
import { Companion } from "@/components/features/companion";
import { Button, Card, Heading, LinkButton, Screen, Stack, Text } from "@/components/ui";
import { ROUTES } from "@/config/app";
import { MISSIONS } from "@/content/missions";
import { useAppState } from "@/hooks/useAppState";
import { useMotionSample } from "@/hooks/useMotionSample";
import { todayKey } from "@/lib/dates";
import {
  chooseCompany,
  confirm,
  createRun,
  start,
  stop,
  tick,
  toMissionLog,
  type MissionRun,
} from "@/lib/missions";
import { corroborateMission } from "@/lib/missions/corroboration";
import type { MissionCompany, MissionConfirmation as ConfirmationKind } from "@/types";
import { CompanySelector } from "../CompanySelector/CompanySelector";
import { MissionActiveRun } from "../MissionActiveRun/MissionActiveRun";
import { MissionConfirmation } from "../MissionConfirmation/MissionConfirmation";
import { MissionResult } from "../MissionResult/MissionResult";
import {
  ReadyActionBox,
  ReadyBox,
  ReadyCompanionBox,
  RunScreenContainer,
} from "./MissionRunScreen.style";

type MissionRunScreenProps = {
  missionId: string;
};

export function MissionRunScreen({ missionId }: MissionRunScreenProps) {
  const { state, actions, isReady } = useAppState();

  const mission = MISSIONS.find((m) => m.id === missionId);
  const isAllowed = Boolean(mission && state.settings?.allowedMissionIds.includes(mission.id));

  const [run, setRun] = useState<MissionRun | null>(() => (mission ? createRun(mission) : null));
  const [isReadyStep, setIsReadyStep] = useState(false);
  const hasSavedRef = useRef(false);
  const motion = useMotionSample();
  const motionVarianceRef = useRef<number | null>(null);

  const isRunning = run?.phase === "running";

  // Timer loop when running
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setRun((prev) => (prev ? tick(prev, Date.now()) : prev));
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Save log once upon completion or rest
  useEffect(() => {
    if (!run) return;
    if (hasSavedRef.current) return;

    if (run.phase === "confirmed" || run.phase === "stopped") {
      hasSavedRef.current = true;
      const baseLog = toMissionLog(run, {
        id: crypto.randomUUID(),
        date: todayKey(),
        createdAt: new Date().toISOString(),
      });
      const corroboration =
        run.phase === "confirmed"
          ? corroborateMission({
              startMs: run.startedAtMs ?? Date.now(),
              endMs: Date.now(),
              motionVariance: motionVarianceRef.current,
            })
          : undefined;
      const log = {
        ...baseLog,
        ...(corroboration ? { corroboration } : {}),
      };
      actions.addMissionLog(log);
    }
  }, [run, actions]);

  if (!isReady) {
    return (
      <Screen>
        <RunScreenContainer>
          <Text tone="muted">Loading mission...</Text>
        </RunScreenContainer>
      </Screen>
    );
  }

  if (!mission || !isAllowed) {
    return (
      <Screen>
        <RunScreenContainer>
          <Stack gap="lg" align="center">
            <Companion
              pose="idle"
              equippedItemIds={state.companion.equippedItemIds}
              name={state.child?.nickname || "Your companion"}
            />
            <Card label="Mission unavailable">
              <Stack gap="md" align="center">
                <Heading level={1}>Mission Not Available</Heading>
                <Text tone="muted">
                  This mission is not enabled right now. Ask a parent to check the missions list, or
                  pick another mission.
                </Text>
                <LinkButton href={ROUTES.missions} variant="primary" fullWidth>
                  Choose another mission
                </LinkButton>
                <LinkButton href={ROUTES.home} variant="secondary" fullWidth>
                  Back to home
                </LinkButton>
              </Stack>
            </Card>
          </Stack>
        </RunScreenContainer>
      </Screen>
    );
  }

  const handleSelectCompany = (company: MissionCompany) => {
    if (!run) return;
    const updated = chooseCompany(run, company);
    setRun(updated);
    setIsReadyStep(true);
  };

  const handleStartMission = () => {
    if (!run) return;
    motion.start();
    const started = start(run, Date.now());
    setRun(started);
    setIsReadyStep(false);
  };

  const handleBackToCompany = () => {
    setIsReadyStep(false);
  };

  const handleStop = () => {
    if (!run) return;
    motionVarianceRef.current = motion.stop();
    const stopped = stop(run);
    setRun(stopped);
    setIsReadyStep(false);
  };

  const handleConfirm = (how: ConfirmationKind) => {
    if (!run) return;
    motionVarianceRef.current = motion.stop();
    const confirmed = confirm(run, how, Date.now());
    setRun(confirmed);
  };

  // Result phase (confirmed or stopped)
  if (run && (run.phase === "confirmed" || run.phase === "stopped")) {
    return (
      <Screen>
        <RunScreenContainer>
          <MissionResult
            status={run.phase === "confirmed" ? "completed" : "rest"}
            company={run.company}
            equippedItemIds={state.companion.equippedItemIds}
            companionName={state.child?.nickname || "Your companion"}
          />
        </RunScreenContainer>
      </Screen>
    );
  }

  // Confirmation phase (finished guided run)
  if (run && run.phase === "finished") {
    return (
      <Screen>
        <RunScreenContainer>
          <MissionConfirmation
            company={run.company}
            parentSettings={state.settings}
            isDemo={state.isDemo}
            onConfirm={handleConfirm}
            onStop={handleStop}
          />
        </RunScreenContainer>
      </Screen>
    );
  }

  // Guided running phase
  if (run && run.phase === "running") {
    return (
      <Screen>
        <RunScreenContainer>
          <MissionActiveRun
            stepIndex={run.currentStepIndex}
            totalSteps={run.mission.steps.length}
            stepText={run.currentStep?.text ?? ""}
            poseKey={run.currentStep?.poseKey ?? "idle"}
            stepRemainingSeconds={run.stepRemainingSeconds}
            totalRemainingSeconds={run.totalRemainingSeconds}
            elapsedMs={run.elapsedMs}
            totalDurationMs={run.totalDurationMs}
            equippedItemIds={state.companion.equippedItemIds}
            onStop={handleStop}
          />
        </RunScreenContainer>
      </Screen>
    );
  }

  // Ready step before guided run
  if (run && isReadyStep) {
    const isAlone = run.company === "alone";
    const readyNote = isAlone
      ? "Take your time and follow each step with your companion."
      : "Get together with your partner and get ready to move together!";

    return (
      <Screen>
        <RunScreenContainer>
          <ReadyBox aria-label="Ready to begin">
            <ReadyCompanionBox>
              <Companion
                pose="idle"
                equippedItemIds={state.companion.equippedItemIds}
                name={state.child?.nickname || "Your companion"}
                size="lg"
              />
            </ReadyCompanionBox>

            <Stack gap="xs" align="center">
              <Heading level={1}>Ready to begin?</Heading>
              <Text tone="muted">{readyNote}</Text>
            </Stack>

            <ReadyActionBox>
              <Button variant="primary" onClick={handleStartMission} fullWidth>
                Start mission
              </Button>
              <Button variant="secondary" onClick={handleBackToCompany} fullWidth>
                Change companion
              </Button>
              <Button variant="secondary" onClick={handleStop} fullWidth>
                Stop
              </Button>
            </ReadyActionBox>
          </ReadyBox>
        </RunScreenContainer>
      </Screen>
    );
  }

  // Initial step: Choose company
  return (
    <Screen>
      <RunScreenContainer>
        <Stack gap="md" align="center">
          <Companion
            pose="idle"
            equippedItemIds={state.companion.equippedItemIds}
            name={state.child?.nickname || "Your companion"}
          />
          <Heading level={1}>{mission.title}</Heading>
          <Text tone="muted">{mission.parentNote}</Text>
        </Stack>

        <CompanySelector onSelect={handleSelectCompany} />

        <LinkButton href={ROUTES.missions} variant="secondary" fullWidth>
          Back to missions
        </LinkButton>
      </RunScreenContainer>
    </Screen>
  );
}
