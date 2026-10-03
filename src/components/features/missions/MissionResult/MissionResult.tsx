"use client";

import { Companion } from "@/components/features/companion";
import { Chip, Heading, LinkButton, Stack, Text } from "@/components/ui";
import { ROUTES } from "@/config/app";
import { MISSION_STOP_MESSAGE } from "@/content/disclaimers";
import { confidenceLabel } from "@/lib/rewards";
import type { MissionCompany, MissionStatus } from "@/types";
import {
  CompanionCheerBox,
  ConfidenceBadgeBox,
  ResultActionNav,
  ResultContainer,
} from "./MissionResult.style";

type MissionResultProps = {
  status: MissionStatus;
  company: MissionCompany;
  equippedItemIds?: string[];
  companionName?: string;
};

export function MissionResult({
  status,
  company,
  equippedItemIds = [],
  companionName = "Your companion",
}: MissionResultProps) {
  const isCompleted = status === "completed";
  const confidenceText = confidenceLabel(company);

  let messageText = MISSION_STOP_MESSAGE;
  if (isCompleted) {
    if (company === "alone") {
      messageText = "You finished your movement routine on your own.";
    } else {
      // Cooperative team wording per product rules
      messageText = "You both did it together!";
    }
  }

  return (
    <ResultContainer aria-label="Mission result">
      <CompanionCheerBox>
        <Companion pose="cheer" equippedItemIds={equippedItemIds} name={companionName} size="lg" />
      </CompanionCheerBox>

      <Stack gap="sm" align="center">
        <Heading level={1}>{isCompleted ? "Nice work!" : "Rest time"}</Heading>
        <Text>{messageText}</Text>
      </Stack>

      <ConfidenceBadgeBox>
        <Chip label={confidenceText} tone="primary" />
      </ConfidenceBadgeBox>

      <Text tone="muted" size="sm">
        Your steady care helps your companion grow.
      </Text>

      <ResultActionNav aria-label="Next steps">
        <LinkButton href={ROUTES.missions} variant="primary" fullWidth>
          More missions
        </LinkButton>
        <LinkButton href={ROUTES.home} variant="secondary" fullWidth>
          Back to home
        </LinkButton>
      </ResultActionNav>
    </ResultContainer>
  );
}
