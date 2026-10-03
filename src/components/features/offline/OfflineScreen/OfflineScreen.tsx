"use client";

import { Heading, LinkButton, Screen, Stack, Text } from "@/components/ui";
import { ROUTES } from "@/config/app";

export function OfflineScreen() {
  return (
    <Screen>
      <Stack gap="lg">
        <Heading>You are offline</Heading>
        <Text>This page is not available without a connection yet.</Text>
        <LinkButton href={ROUTES.home}>Go to the home screen</LinkButton>
      </Stack>
    </Screen>
  );
}
