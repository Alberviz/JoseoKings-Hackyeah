"use client";

import { Companion, type CompanionPose } from "@/components/features/companion";
import { Button, Heading, ProgressBar, Stack } from "@/components/ui";
import {
  ActiveRunContainer,
  CompanionBox,
  CountdownNumber,
  StepIndicator,
  StepTextBox,
  StopActionBox,
  TimerDisplay,
  TimerLabel,
} from "./MissionActiveRun.style";

const VALID_POSES: ReadonlySet<CompanionPose> = new Set([
  "idle",
  "breathe",
  "stretch",
  "balance",
  "strength",
  "cheer",
]);

function toCompanionPose(poseKey: string): CompanionPose {
  if (VALID_POSES.has(poseKey as CompanionPose)) {
    return poseKey as CompanionPose;
  }
  return "idle";
}

type MissionActiveRunProps = {
  stepIndex: number;
  totalSteps: number;
  stepText: string;
  poseKey: string;
  stepRemainingSeconds: number;
  totalRemainingSeconds: number;
  elapsedMs: number;
  totalDurationMs: number;
  equippedItemIds?: string[];
  onStop: () => void;
};

export function MissionActiveRun({
  stepIndex,
  totalSteps,
  stepText,
  poseKey,
  stepRemainingSeconds,
  totalRemainingSeconds,
  elapsedMs,
  totalDurationMs,
  equippedItemIds = [],
  onStop,
}: MissionActiveRunProps) {
  const companionPose = toCompanionPose(poseKey);

  return (
    <ActiveRunContainer aria-live="polite">
      <Stack gap="xs" align="center">
        <StepIndicator>
          Step {stepIndex + 1} of {totalSteps}
        </StepIndicator>
      </Stack>

      <CompanionBox>
        <Companion pose={companionPose} equippedItemIds={equippedItemIds} size="lg" />
      </CompanionBox>

      <StepTextBox>
        <Heading level={2}>{stepText}</Heading>
      </StepTextBox>

      <TimerDisplay>
        <CountdownNumber>{stepRemainingSeconds}s</CountdownNumber>
        <TimerLabel>remaining in this step • {totalRemainingSeconds}s total</TimerLabel>
      </TimerDisplay>

      <ProgressBar value={elapsedMs} max={totalDurationMs} label="Overall mission progress" />

      <StopActionBox>
        <Button variant="secondary" onClick={onStop} fullWidth>
          Stop
        </Button>
      </StopActionBox>
    </ActiveRunContainer>
  );
}
