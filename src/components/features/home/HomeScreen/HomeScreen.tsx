"use client";

import { Card, Heading, Screen, Stack, Text } from "@/components/ui";
import { APP_DESCRIPTION, APP_NAME } from "@/config/app";

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

        <Card label="Work in progress">
          <Heading level={2}>Work in progress</Heading>
          <Text>The child home, the check-in and the missions are being built.</Text>
        </Card>
      </Stack>
    </Screen>
  );
}
