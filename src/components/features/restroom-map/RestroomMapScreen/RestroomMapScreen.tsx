"use client";

import { Heading, LinkButton, Screen, Stack, Text } from "@/components/ui";
import { ROUTES } from "@/config/app";

// Placeholder. See docs/TASKS.md, pillar 1.
export function RestroomMapScreen() {
  return (
    <Screen>
      <Stack gap="lg">
        <Heading>Nearest restrooms</Heading>
        <Text tone="muted">The map is coming soon.</Text>
        <LinkButton href={ROUTES.home} variant="secondary">
          Back
        </LinkButton>
      </Stack>
    </Screen>
  );
}
