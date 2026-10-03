"use client";

import { Heading, LinkButton, Screen, Stack, Text } from "@/components/ui";
import { ROUTES } from "@/config/app";

// Placeholder. See docs/TASKS.md, pillar 2.
export function MenuReaderScreen() {
  return (
    <Screen>
      <Stack gap="lg">
        <Heading>Menu reader</Heading>
        <Text tone="muted">The menu reader is coming soon.</Text>
        <LinkButton href={ROUTES.home} variant="secondary">
          Back
        </LinkButton>
      </Stack>
    </Screen>
  );
}
