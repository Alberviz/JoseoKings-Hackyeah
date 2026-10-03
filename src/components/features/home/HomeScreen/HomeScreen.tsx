"use client";

import { Card, Heading, LinkButton, Screen, Stack, Text } from "@/components/ui";
import { APP_DESCRIPTION, APP_NAME, ROUTES } from "@/config/app";

// Temporary home. Task T6 replaces it with the child home (companion, check-in, missions).
// The restroom map and the menu reader are paused and are not linked from here.
export function HomeScreen() {
  return (
    <Screen>
      <Stack gap="xl">
        <Stack gap="sm">
          <Heading>{APP_NAME}</Heading>
          <Text tone="muted">{APP_DESCRIPTION}</Text>
        </Stack>

        <Card label="Daily Check-in">
          <Heading level={2}>Daily Check-in</Heading>
          <Text>Tell your companion how you are feeling today with a few quick taps.</Text>
          <LinkButton href={ROUTES.checkIn} variant="primary" fullWidth>
            Start Check-in
          </LinkButton>
        </Card>
      </Stack>
    </Screen>
  );
}
