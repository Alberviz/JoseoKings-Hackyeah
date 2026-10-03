"use client";

import { useState } from "react";
import { useTheme } from "styled-components";
import { Companion } from "@/components/features/companion";
import { Button, Heading, LinkButton, ProgressBar, Screen, Stack, Text } from "@/components/ui";
import { ROUTES } from "@/config/app";
import { FIRE_MAX } from "@/config/economy";
import { useAppState } from "@/hooks/useAppState";
import {
  ActionsContainer,
  FireStatusRow,
  FireValueBadge,
  FoodCountBadge,
  FoodRoot,
  NoticeBanner,
  Stage,
  StatsCard,
  SvgAppleIcon,
  SvgFireIcon,
  SvgPath,
  TopBar,
  ValueText,
} from "./FoodScreen.style";

function FireIcon() {
  const theme = useTheme();
  return (
    <SvgFireIcon viewBox="0 0 24 24" aria-hidden="true">
      <SvgPath
        d="M12 2 C10 6 7 9 7 13 C7 17 9 20 12 20 C15 20 17 17 17 13 C17 9 14 6 12 2 Z"
        fill={theme.colors.accent}
        stroke={theme.colors.ink}
        strokeWidth="2"
      />
      <SvgPath
        d="M12 9 C11 11 9.5 13 9.5 15 C9.5 16.5 10.5 18 12 18 C13.5 18 14.5 16.5 14.5 15 C14.5 13 13 11 12 9 Z"
        fill={theme.colors.highlight}
      />
    </SvgFireIcon>
  );
}

function AppleIcon() {
  const theme = useTheme();
  return (
    <SvgAppleIcon viewBox="0 0 32 32" aria-hidden="true">
      <SvgPath
        d="M16 4 Q18 8 16 11"
        stroke={theme.colors.ink}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <SvgPath
        d="M16 6 Q21 4 20 8 Q17 9 16 6"
        fill={theme.colors.success}
        stroke={theme.colors.ink}
        strokeWidth="1.2"
      />
      <SvgPath
        d="M16 11 C11 10 6 13 6 19 C6 26 12 29 16 29 C20 29 26 26 26 19 C26 13 21 10 16 11 Z"
        fill={theme.colors.accent}
        stroke={theme.colors.ink}
        strokeWidth="2"
      />
    </SvgAppleIcon>
  );
}

export function FoodScreen() {
  const { state, actions, isReady } = useAppState();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isEating, setIsEating] = useState(false);

  if (!isReady) {
    return (
      <Screen>
        <Text tone="muted">Loading food...</Text>
      </Screen>
    );
  }

  const fire = state.economy.fire;
  const foodCount = state.economy.inventory.food;
  const companionName = state.companion?.name || state.child?.nickname || "Companion";
  const equippedItemIds = state.economy.equippedItemIds;

  const handleGiveFood = () => {
    const result = actions.giveFood();
    if (result.ok) {
      setIsEating(true);
      setFeedback("Yum! Dragon fire increased!");
      setTimeout(() => setIsEating(false), 1400);
    } else if (result.reason === "no-food") {
      setFeedback("You have no food left! Visit the shop to buy more.");
    }
  };

  const isFireFull = fire >= FIRE_MAX;

  return (
    <Screen>
      <FoodRoot>
        <TopBar>
          <LinkButton href={ROUTES.home} variant="secondary">
            ← Home
          </LinkButton>
        </TopBar>

        <Stack gap="xs" align="center">
          <Heading level={1}>Feed Companion</Heading>
          <Text tone="muted">Feeding your dragon keeps its fire bright!</Text>
        </Stack>

        <Stage>
          <Companion
            pose={isEating ? "cheer" : "idle"}
            equippedItemIds={equippedItemIds}
            name={companionName}
            size="lg"
            isEating={isEating}
            showEmbers={isEating}
          />
        </Stage>

        <StatsCard aria-label="Food and fire status">
          <FireStatusRow>
            <Heading level={3}>Dragon Fire</Heading>
            <FireValueBadge aria-label={`${fire} of ${FIRE_MAX} fire`}>
              <FireIcon />
              <ValueText>
                {fire} / {FIRE_MAX}
              </ValueText>
            </FireValueBadge>
          </FireStatusRow>

          <ProgressBar value={fire} max={FIRE_MAX} label="Dragon fire bar" />

          <FoodCountBadge aria-label={`${foodCount} food portions in inventory`}>
            <AppleIcon />
            <ValueText>Food: {foodCount}</ValueText>
          </FoodCountBadge>

          {feedback && (
            <NoticeBanner role="status" aria-live="polite">
              <Text>{feedback}</Text>
            </NoticeBanner>
          )}

          {isFireFull && (
            <NoticeBanner>
              <Text>Fire is completely full! (100 / 100)</Text>
            </NoticeBanner>
          )}

          <ActionsContainer>
            <Button
              variant="primary"
              fullWidth
              disabled={foodCount <= 0 || isFireFull}
              onClick={handleGiveFood}
              aria-label="Give food to companion"
            >
              Give food
            </Button>

            {foodCount === 0 && (
              <LinkButton href={ROUTES.shop} variant="secondary" fullWidth>
                Buy food in the shop
              </LinkButton>
            )}
          </ActionsContainer>
        </StatsCard>
      </FoodRoot>
    </Screen>
  );
}
