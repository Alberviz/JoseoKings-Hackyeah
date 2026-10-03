"use client";

import { Card, Heading, LinkButton, Screen, Stack, Text } from "@/components/ui";
import { APP_DESCRIPTION, APP_NAME, ROUTES } from "@/config/app";

export function HomeScreen() {
  return (
    <Screen>
      <Stack gap="xl">
        <Stack gap="sm">
          <Heading>{APP_NAME}</Heading>
          <Text tone="muted">{APP_DESCRIPTION}</Text>
        </Stack>

        <Card label="Child Check-in">
          <Heading level={2}>Daily Check-in</Heading>
          <Text>Tell your companion how you are feeling today with a few quick taps.</Text>
          <LinkButton href={ROUTES.checkIn} variant="primary" fullWidth>
            Start Check-in
          </LinkButton>
        </Card>

        <LinkButton href={ROUTES.restroomMap} variant="urgent" fullWidth>
          I need a restroom now
        </LinkButton>

        <Card label="Menu reader">
          <Heading level={2}>Check a menu</Heading>
          <Text>Take a photo of a menu and see which dishes contain your trigger foods.</Text>
          <LinkButton href={ROUTES.menuReader} variant="secondary" fullWidth>
            Open menu reader
          </LinkButton>
        </Card>
      </Stack>
    </Screen>
  );
}
