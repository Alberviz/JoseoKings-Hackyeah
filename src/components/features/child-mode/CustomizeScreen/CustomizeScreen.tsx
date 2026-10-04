"use client";

import { useTheme } from "styled-components";
import { Companion } from "@/components/features/companion";
import { Heading, LinkButton, Screen, Stack, Text } from "@/components/ui";
import { ROUTES } from "@/config/app";
import { SHOP_ITEMS, type ShopItemConfig } from "@/config/economy";
import { getDragonEvolution } from "@/lib/economy";
import { useAppState } from "@/hooks/useAppState";
import type { ShopItemId } from "@/types";
import {
  CustomizeRoot,
  EmptyStateCard,
  ItemLabel,
  Stage,
  SvgCircle,
  SvgEllipse,
  SvgPath,
  SvgRect,
  SvgTickIcon,
  SvgWearableIcon,
  TickBadge,
  TopBar,
  WardrobeSection,
  WearableItemWrapper,
  WearablesRow,
  WearableSquareButton,
} from "./CustomizeScreen.style";

const WEARABLE_NAMES: Record<string, string> = {
  glasses: "Glasses",
  sunglasses: "Sun Glasses",
  "t-shirt": "T-shirt",
  "sport-shirt": "Sport T-shirt",
  hat: "Hat",
  cap: "Cap",
};

function WearableIcon({ id }: { id: string }) {
  const theme = useTheme();

  if (id === "glasses") {
    return (
      <SvgWearableIcon viewBox="0 0 32 32" aria-hidden="true">
        <SvgRect
          x="4"
          y="11"
          width="10"
          height="9"
          rx="3"
          fill={theme.colors.primarySoft}
          stroke={theme.colors.ink}
          strokeWidth="2"
        />
        <SvgRect
          x="18"
          y="11"
          width="10"
          height="9"
          rx="3"
          fill={theme.colors.primarySoft}
          stroke={theme.colors.ink}
          strokeWidth="2"
        />
        <SvgPath
          d="M14 15 Q16 13 18 15"
          stroke={theme.colors.ink}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <SvgPath
          d="M4 14 L1 13 M28 14 L31 13"
          stroke={theme.colors.ink}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </SvgWearableIcon>
    );
  }

  if (id === "sunglasses") {
    return (
      <SvgWearableIcon viewBox="0 0 32 32" aria-hidden="true">
        <SvgRect
          x="4"
          y="11"
          width="10"
          height="9"
          rx="3"
          fill={theme.colors.ink}
          stroke={theme.colors.accent}
          strokeWidth="2"
        />
        <SvgRect
          x="18"
          y="11"
          width="10"
          height="9"
          rx="3"
          fill={theme.colors.ink}
          stroke={theme.colors.accent}
          strokeWidth="2"
        />
        <SvgPath
          d="M14 15 Q16 13 18 15"
          stroke={theme.colors.accent}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <SvgPath
          d="M6 14 L10 18 M20 14 L24 18"
          stroke={theme.colors.onPrimary}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </SvgWearableIcon>
    );
  }

  if (id === "t-shirt") {
    return (
      <SvgWearableIcon viewBox="0 0 32 32" aria-hidden="true">
        <SvgPath
          d="M10 8 L5 12 L8 16 L11 14 L11 26 L21 26 L21 14 L24 16 L27 12 L22 8 Q16 11 10 8 Z"
          fill={theme.colors.lavender}
          stroke={theme.colors.ink}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <SvgPath
          d="M12 8 Q16 11 20 8"
          stroke={theme.colors.ink}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </SvgWearableIcon>
    );
  }

  if (id === "sport-shirt") {
    return (
      <SvgWearableIcon viewBox="0 0 32 32" aria-hidden="true">
        <SvgPath
          d="M10 8 L5 12 L8 16 L11 14 L11 26 L21 26 L21 14 L24 16 L27 12 L22 8 Q16 11 10 8 Z"
          fill={theme.colors.accent}
          stroke={theme.colors.ink}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <SvgPath
          d="M11 18 L21 18"
          stroke={theme.colors.onPrimary}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <SvgPath
          d="M12 8 Q16 11 20 8"
          stroke={theme.colors.ink}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </SvgWearableIcon>
    );
  }

  if (id === "cap") {
    return (
      <SvgWearableIcon viewBox="0 0 32 32" aria-hidden="true">
        {/* Cap dome */}
        <SvgPath
          d="M7 21 C7 12 12 10 19 10 C24 10 26 13 26 21 Z"
          fill={theme.colors.accent}
          stroke={theme.colors.ink}
          strokeWidth="2"
        />
        {/* Visor */}
        <SvgPath
          d="M19 21 L30 21 C31 22 30 24 25 24 L14 24"
          fill={theme.colors.highlight}
          stroke={theme.colors.ink}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Top button */}
        <SvgCircle
          cx="18"
          cy="10"
          r="2"
          fill={theme.colors.highlight}
          stroke={theme.colors.ink}
          strokeWidth="1"
        />
      </SvgWearableIcon>
    );
  }

  // Hat (Explorer Hat)
  return (
    <SvgWearableIcon viewBox="0 0 32 32" aria-hidden="true">
      <SvgPath
        d="M9 19 C9 11 12 9 16 9 C20 9 23 11 23 19 Z"
        fill={theme.colors.highlight}
        stroke={theme.colors.ink}
        strokeWidth="2"
      />
      <SvgPath d="M9 17 Q16 19 23 17 L23 19 Q16 21 9 19 Z" fill={theme.colors.accent} />
      <SvgEllipse
        cx="16"
        cy="20"
        rx="13"
        ry="4"
        fill={theme.colors.highlight}
        stroke={theme.colors.ink}
        strokeWidth="2"
      />
    </SvgWearableIcon>
  );
}

function TickIcon() {
  const theme = useTheme();
  return (
    <SvgTickIcon viewBox="0 0 14 14" aria-hidden="true">
      <SvgPath
        d="M3 7 L6 10 L11 4"
        stroke={theme.colors.onPrimary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </SvgTickIcon>
  );
}

export function CustomizeScreen() {
  const { state, actions, isReady } = useAppState();

  if (!isReady) {
    return (
      <Screen>
        <Text tone="muted">Loading customize...</Text>
      </Screen>
    );
  }

  const companionName = state.companion?.name || state.child?.nickname || "Companion";
  const equippedItemIds = state.economy.equippedItemIds;
  const ownedItemIds = state.economy.ownedItemIds;

  const ownedWearables = SHOP_ITEMS.filter(
    (item): item is Extract<ShopItemConfig, { kind: "wearable" }> =>
      item.kind === "wearable" && ownedItemIds.includes(item.id),
  );

  const handleToggle = (itemId: ShopItemId) => {
    if (equippedItemIds.includes(itemId)) {
      actions.unequipShopItem(itemId);
    } else {
      actions.equipShopItem(itemId);
    }
  };

  const evolution = getDragonEvolution(state.economy ?? { fire: 0 });

  return (
    <Screen>
      <CustomizeRoot>
        <TopBar>
          <LinkButton href={ROUTES.home} variant="secondary">
            ← Home
          </LinkButton>
        </TopBar>

        <Stack gap="xs" align="center">
          <Heading level={1}>Dress Up {companionName}</Heading>
          <Text tone="muted">Tap an item to put it on or take it off.</Text>
        </Stack>

        <Stage aria-label="Companion preview stage">
          <Companion
            pose="idle"
            equippedItemIds={equippedItemIds}
            name={companionName}
            size="lg"
            stage={evolution.stage}
          />
        </Stage>

        <WardrobeSection aria-label="Your Accessories">
          <Heading level={2}>Your Accessories</Heading>

          {ownedWearables.length === 0 ? (
            <EmptyStateCard>
              <Text tone="muted">
                You don&apos;t have any accessories yet! Visit the shop to get hats, glasses, and
                t-shirts for your companion.
              </Text>
              <LinkButton href={ROUTES.shop} variant="primary">
                Visit the shop
              </LinkButton>
            </EmptyStateCard>
          ) : (
            <WearablesRow role="group" aria-label="Owned accessories">
              {ownedWearables.map((item) => {
                const isEquipped = equippedItemIds.includes(item.id);
                const name = WEARABLE_NAMES[item.id] || item.id;

                return (
                  <WearableItemWrapper key={item.id}>
                    <WearableSquareButton
                      type="button"
                      $isEquipped={isEquipped}
                      aria-pressed={isEquipped}
                      aria-label={`${name}${isEquipped ? " (worn)" : ""}`}
                      onClick={() => handleToggle(item.id)}
                    >
                      <WearableIcon id={item.id} />
                      {isEquipped && (
                        <TickBadge aria-hidden="true">
                          <TickIcon />
                        </TickBadge>
                      )}
                    </WearableSquareButton>
                    <ItemLabel>{name}</ItemLabel>
                  </WearableItemWrapper>
                );
              })}
            </WearablesRow>
          )}
        </WardrobeSection>
      </CustomizeRoot>
    </Screen>
  );
}
