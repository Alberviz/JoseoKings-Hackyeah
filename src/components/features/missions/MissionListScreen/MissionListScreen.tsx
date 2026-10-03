"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Companion } from "@/components/features/companion";
import { Card, Heading, LinkButton, Screen, Stack, Text } from "@/components/ui";
import { missionRoute, ROUTES } from "@/config/app";
import { MISSIONS } from "@/content/missions";
import { useAppState } from "@/hooks/useAppState";
import { calculateTotalDurationMs } from "@/lib/missions";
import type { Mission } from "@/types";
import {
  DurationTag,
  ListContainer,
  MissionHeaderRow,
  MissionListItem,
  MissionsList,
} from "./MissionListScreen.style";

function formatDuration(mission: Mission): string {
  const totalSeconds = Math.round(calculateTotalDurationMs(mission) / 1000);
  if (totalSeconds >= 60) {
    const minutes = Math.round(totalSeconds / 60);
    return `${minutes} min`;
  }
  return `${totalSeconds}s`;
}

export function MissionListScreen() {
  const router = useRouter();
  const { state, isReady } = useAppState();

  useEffect(() => {
    if (!isReady) return;
    if (!state.child) {
      router.replace(ROUTES.parentSetup);
    }
  }, [isReady, state.child, router]);

  if (!isReady) {
    return (
      <Screen>
        <ListContainer>
          <Text tone="muted">Loading missions...</Text>
        </ListContainer>
      </Screen>
    );
  }

  if (!state.child) {
    return null;
  }

  const allowedIds = state.settings?.allowedMissionIds ?? [];
  const allowedMissions = MISSIONS.filter((mission) => allowedIds.includes(mission.id));

  return (
    <Screen>
      <ListContainer aria-label="Missions">
        <Stack gap="md" align="center">
          <Companion
            pose="idle"
            equippedItemIds={state.companion.equippedItemIds}
            name={state.child.nickname || "Your companion"}
            size="md"
          />
          <Stack gap="xs" align="center">
            <Heading level={1}>Missions</Heading>
            <Text tone="muted">Gentle movement routines to do with your companion.</Text>
          </Stack>
        </Stack>

        {allowedMissions.length === 0 ? (
          <Card label="No missions enabled">
            <Stack gap="md" align="center">
              <Text>Ask a parent to enable missions</Text>
              <LinkButton href={ROUTES.home} variant="secondary">
                Back to home
              </LinkButton>
            </Stack>
          </Card>
        ) : (
          <>
            <MissionsList aria-label="Available missions">
              {allowedMissions.map((mission) => (
                <MissionListItem key={mission.id}>
                  <Card label={mission.title}>
                    <Stack gap="md">
                      <MissionHeaderRow>
                        <Heading level={2}>{mission.title}</Heading>
                        <DurationTag>{formatDuration(mission)}</DurationTag>
                      </MissionHeaderRow>
                      <Text tone="muted">{mission.parentNote}</Text>
                      <LinkButton href={missionRoute(mission.id)} variant="primary" fullWidth>
                        Start mission
                      </LinkButton>
                    </Stack>
                  </Card>
                </MissionListItem>
              ))}
            </MissionsList>

            <LinkButton href={ROUTES.home} variant="secondary" fullWidth>
              Back to home
            </LinkButton>
          </>
        )}
      </ListContainer>
    </Screen>
  );
}
