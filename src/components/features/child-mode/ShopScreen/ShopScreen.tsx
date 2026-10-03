"use client";

import { useState } from "react";
import { useTheme } from "styled-components";
import { Button, Heading, LinkButton, Screen, Stack, Text } from "@/components/ui";
import { ROUTES } from "@/config/app";
import { SHOP_ITEMS } from "@/config/economy";
import { useAppState } from "@/hooks/useAppState";
import { coinBalance } from "@/lib/economy";
import {
  AddCoinsButton,
  ClaimItem,
  ClaimItemText,
  ClaimsList,
  ClaimsSection,
  ClaimStatusText,
  CountersRow,
  ItemIconWrapper,
  ItemInfo,
  ItemLeft,
  ItemNameText,
  ItemsList,
  MessageBanner,
  OwnedBadge,
  PriceTag,
  RewardCard,
  RewardFireCost,
  RewardInfo,
  RewardNameText,
  Section,
  ShopItemCard,
  ShopRoot,
  StatPill,
  SvgCircle,
  SvgCoinIcon,
  SvgEllipse,
  SvgFireIcon,
  SvgItemIcon,
  SvgPath,
  SvgRect,
  TopBar,
} from "./ShopScreen.style";

const ITEM_NAMES: Record<string, string> = {
  food: "Food",
  glasses: "Glasses",
  "t-shirt": "T-shirt",
  hat: "Hat",
};

function ItemIcon({ id }: { id: string }) {
  const theme = useTheme();

  if (id === "food") {
    return (
      <SvgItemIcon viewBox="0 0 32 32" aria-hidden="true">
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
      </SvgItemIcon>
    );
  }

  if (id === "glasses") {
    return (
      <SvgItemIcon viewBox="0 0 32 32" aria-hidden="true">
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
      </SvgItemIcon>
    );
  }

  if (id === "t-shirt") {
    return (
      <SvgItemIcon viewBox="0 0 32 32" aria-hidden="true">
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
      </SvgItemIcon>
    );
  }

  // Hat
  return (
    <SvgItemIcon viewBox="0 0 32 32" aria-hidden="true">
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
    </SvgItemIcon>
  );
}

function CoinIcon() {
  const theme = useTheme();
  return (
    <SvgCoinIcon viewBox="0 0 24 24" aria-hidden="true">
      <SvgCircle
        cx="12"
        cy="12"
        r="9"
        fill={theme.colors.highlight}
        stroke={theme.colors.ink}
        strokeWidth="2"
      />
      <SvgCircle
        cx="12"
        cy="12"
        r="6"
        fill="none"
        stroke={theme.colors.ink}
        strokeWidth="1.2"
        strokeDasharray="2 1.5"
      />
      <SvgPath
        d="M12 8v8M10 10h4"
        stroke={theme.colors.ink}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </SvgCoinIcon>
  );
}

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

export function ShopScreen() {
  const { state, actions, isReady } = useAppState();
  const [inlineMessage, setInlineMessage] = useState<string | null>(null);

  if (!isReady) {
    return (
      <Screen>
        <Text tone="muted">Loading shop...</Text>
      </Screen>
    );
  }

  const fire = state.economy.fire;
  const coins = coinBalance(state);
  const ownedItemIds = state.economy.ownedItemIds;
  const specialRewards = state.economy.specialRewards;
  const requestedClaims = state.economy.rewardClaims.filter(
    (claim) => claim.status === "requested",
  );

  const handleBuy = (itemId: string) => {
    const result = actions.buyShopItem(itemId);
    if (!result.ok) {
      if (result.reason === "not-enough-coins") {
        setInlineMessage("Not enough coins yet. Play to earn more.");
      } else if (result.reason === "already-owned") {
        setInlineMessage("You already own this item!");
      } else {
        setInlineMessage("Could not buy item.");
      }
    } else {
      const name = ITEM_NAMES[itemId] || itemId;
      setInlineMessage(`You got ${name}!`);
    }
  };

  const handleClaim = (rewardId: string) => {
    const result = actions.claimReward(rewardId);
    if (!result.ok) {
      if (result.reason === "not-enough-fire") {
        setInlineMessage("Not enough fire yet. Feed your dragon to earn more.");
      } else {
        setInlineMessage("Could not claim reward.");
      }
    } else {
      setInlineMessage("Asked! Your family will tell you when.");
    }
  };

  const getRewardName = (rewardId: string) => {
    const found = specialRewards.find((r) => r.id === rewardId);
    return found ? found.name : "Special reward";
  };

  return (
    <Screen>
      <ShopRoot>
        <TopBar>
          <LinkButton href={ROUTES.home} variant="secondary">
            ← Home
          </LinkButton>
          <CountersRow>
            <StatPill aria-label={`${fire} fire`}>
              <FireIcon />
              <ItemNameText>{fire}</ItemNameText>
            </StatPill>
            <StatPill aria-label={`${coins} coins`}>
              <CoinIcon />
              <ItemNameText>{coins}</ItemNameText>
            </StatPill>
            <AddCoinsButton
              type="button"
              onClick={() => {
                actions.addCoins(100);
                setInlineMessage("Added +100 coins for testing!");
              }}
              aria-label="Add 100 test coins"
            >
              +100 🪙
            </AddCoinsButton>
          </CountersRow>
        </TopBar>

        <Stack gap="xs">
          <Heading level={1}>Shop</Heading>
          <Text tone="muted">
            Spend coins to get food and wearables, or spend fire to claim rewards from home.
          </Text>
        </Stack>

        {inlineMessage && (
          <MessageBanner role="status" aria-live="polite">
            <ItemNameText>{inlineMessage}</ItemNameText>
          </MessageBanner>
        )}

        <Section aria-label="Items">
          <Heading level={2}>Items</Heading>
          <ItemsList>
            {SHOP_ITEMS.map((item) => {
              const name = ITEM_NAMES[item.id] || item.id;
              const isOwned = item.kind === "wearable" && ownedItemIds.includes(item.id);

              return (
                <ShopItemCard key={item.id} aria-label={`${name} card`}>
                  <ItemLeft>
                    <ItemIconWrapper>
                      <ItemIcon id={item.id} />
                    </ItemIconWrapper>
                    <ItemInfo>
                      <ItemNameText>{name}</ItemNameText>
                      <PriceTag>
                        <CoinIcon />
                        {item.price} coins
                      </PriceTag>
                    </ItemInfo>
                  </ItemLeft>

                  {isOwned ? (
                    <OwnedBadge>Owned</OwnedBadge>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => handleBuy(item.id)}
                      aria-label={`Buy ${name} for ${item.price} coins`}
                    >
                      Buy
                    </Button>
                  )}
                </ShopItemCard>
              );
            })}
          </ItemsList>
        </Section>

        <Section aria-label="Rewards from home">
          <Heading level={2}>Rewards from home</Heading>
          <Text tone="muted">
            Special rewards agreed with your family. Spend your dragon&apos;s fire to ask for them.
          </Text>

          <ItemsList>
            {specialRewards.map((reward) => (
              <RewardCard key={reward.id} aria-label={`${reward.name} reward`}>
                <RewardInfo>
                  <RewardNameText>{reward.name}</RewardNameText>
                  <RewardFireCost>
                    <FireIcon />
                    {reward.fireCost} fire
                  </RewardFireCost>
                </RewardInfo>

                <Button
                  variant="accent"
                  onClick={() => handleClaim(reward.id)}
                  aria-label={`Claim ${reward.name} for ${reward.fireCost} fire`}
                >
                  Claim
                </Button>
              </RewardCard>
            ))}
          </ItemsList>
        </Section>

        {requestedClaims.length > 0 && (
          <ClaimsSection aria-label="Requested from family">
            <Heading level={3}>Requested from family</Heading>
            <ClaimsList>
              {requestedClaims.map((claim) => (
                <ClaimItem key={claim.id}>
                  <ClaimItemText>{getRewardName(claim.rewardId)}</ClaimItemText>
                  <ClaimStatusText>Asked! Your family will tell you when.</ClaimStatusText>
                </ClaimItem>
              ))}
            </ClaimsList>
          </ClaimsSection>
        )}
      </ShopRoot>
    </Screen>
  );
}
