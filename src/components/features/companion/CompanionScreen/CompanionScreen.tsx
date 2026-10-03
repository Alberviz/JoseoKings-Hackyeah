"use client";

import { useMemo, useState } from "react";
import { Companion } from "../Companion/Companion";
import { COMPANION_POSES, type CompanionPose } from "../Companion/poses";
import { BADGES, COMPANION_ITEMS, nextUnlock } from "@/lib/rewards";
import {
  Button,
  Chip,
  Heading,
  LinkButton,
  ProgressBar,
  Screen,
  Stack,
  Text,
} from "@/components/ui";
import { ROUTES } from "@/config/app";
import { useAppState } from "@/hooks/useAppState";
import {
  BadgeCard,
  BadgeHeader,
  BadgeIconContainer,
  BadgesGrid,
  CostText,
  EquippedPillsRow,
  FilterBar,
  FilterChip,
  HighlightText,
  ItemCard,
  ItemHeader,
  ItemsGrid,
  LockedNotice,
  PoseBar,
  PoseButton,
  ScreenContainer,
  ShowcaseCard,
  CompanionStage,
  SlotTag,
  StatPill,
  TopNav,
  TrackCard,
  TrackGrid,
  TrackHeader,
} from "./CompanionScreen.style";

export function CompanionScreen() {
  const { state, actions, isReady } = useAppState();
  const [pose, setPose] = useState<CompanionPose>("idle");
  const [filter, setFilter] = useState<"all" | "main" | "team">("all");

  const companion = state.companion;
  const child = state.child;

  const nextMain = useMemo(() => nextUnlock(companion, "main", COMPANION_ITEMS), [companion]);
  const nextTeam = useMemo(() => nextUnlock(companion, "team", COMPANION_ITEMS), [companion]);

  const filteredItems = useMemo(() => {
    return COMPANION_ITEMS.filter((item) => {
      if (filter === "all") return true;
      return item.track === filter;
    });
  }, [filter]);

  if (!isReady) {
    return (
      <Screen>
        <ScreenContainer>
          <Text tone="muted">Loading companion...</Text>
        </ScreenContainer>
      </Screen>
    );
  }

  const companionDisplayName = companion.name || child?.nickname || "Your companion";

  return (
    <Screen>
      <ScreenContainer>
        <TopNav>
          <LinkButton href={ROUTES.home} variant="secondary">
            ← Home
          </LinkButton>
        </TopNav>

        <Stack gap="xs">
          <Heading level={1}>Your Companion</Heading>
          <Text tone="muted">
            Customize your companion with gear and colours, check your unlock progress, and view
            earned badges.
          </Text>
        </Stack>

        {/* Companion Showcase */}
        <ShowcaseCard aria-label="Companion preview">
          <CompanionStage>
            <Companion
              pose={pose}
              equippedItemIds={companion.equippedItemIds}
              size="lg"
              name={companionDisplayName}
            />
          </CompanionStage>

          <Stack gap="xs" align="center">
            <Heading level={3}>{companionDisplayName}</Heading>
            <Text size="sm" tone="muted">
              Choose a pose to see how your companion looks:
            </Text>
          </Stack>

          <PoseBar role="group" aria-label="Companion pose selection">
            {COMPANION_POSES.map((p) => (
              <PoseButton
                key={p}
                type="button"
                $active={pose === p}
                aria-pressed={pose === p}
                onClick={() => setPose(p)}
              >
                {p}
              </PoseButton>
            ))}
          </PoseBar>

          <EquippedPillsRow aria-label="Equipped items">
            {companion.equippedItemIds.length === 0 ? (
              <Text size="sm" tone="muted">
                No items equipped yet. Pick an unlocked item below!
              </Text>
            ) : (
              companion.equippedItemIds.map((id) => {
                const item = COMPANION_ITEMS.find((it) => it.id === id);
                return item ? (
                  <Chip
                    key={id}
                    label={`${item.slot}: ${item.name}`}
                    tone="primary"
                    onToggle={() => actions.unequipItem(id)}
                  />
                ) : null;
              })
            )}
          </EquippedPillsRow>
        </ShowcaseCard>

        {/* Progress Tracks */}
        <Stack gap="sm">
          <Heading level={2}>Unlock Tracks</Heading>
          <Text tone="muted">Progress only goes up. Unlocked items are always yours to keep.</Text>
          <TrackGrid>
            {/* Main Track */}
            <TrackCard>
              <TrackHeader>
                <Heading level={3}>Main Track</Heading>
                <StatPill>{companion.points} points</StatPill>
              </TrackHeader>
              <Text size="sm" tone="muted">
                Earned with every daily check-in and completed or rest mission.
              </Text>
              {nextMain ? (
                <Stack gap="xs">
                  <Text size="sm">
                    Next: <HighlightText>{nextMain.item.name}</HighlightText> ({nextMain.have}/
                    {nextMain.need} pts)
                  </Text>
                  <ProgressBar
                    value={nextMain.have}
                    max={nextMain.need}
                    label="Main track unlock progress"
                  />
                </Stack>
              ) : (
                <Text size="sm" tone="muted">
                  All main track items unlocked!
                </Text>
              )}
            </TrackCard>

            {/* Team Track */}
            <TrackCard>
              <TrackHeader>
                <Heading level={3}>Team Track</Heading>
                <StatPill>{companion.teamStars} stars</StatPill>
              </TrackHeader>
              <Text size="sm" tone="muted">
                Earned when you complete missions together with family or someone else.
              </Text>
              {nextTeam ? (
                <Stack gap="xs">
                  <Text size="sm">
                    Next: <HighlightText>{nextTeam.item.name}</HighlightText> ({nextTeam.have}/
                    {nextTeam.need} stars)
                  </Text>
                  <ProgressBar
                    value={nextTeam.have}
                    max={nextTeam.need}
                    label="Team track unlock progress"
                  />
                </Stack>
              ) : (
                <Text size="sm" tone="muted">
                  All team track items unlocked!
                </Text>
              )}
            </TrackCard>
          </TrackGrid>
        </Stack>

        {/* Items & Wardrobe */}
        <Stack gap="md">
          <Stack gap="xs">
            <Heading level={2}>Accessories & Colours</Heading>
            <Text tone="muted">Select any unlocked item to wear it on your companion.</Text>
          </Stack>

          <FilterBar role="group" aria-label="Filter items by track">
            <FilterChip
              type="button"
              $active={filter === "all"}
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
            >
              All Items ({COMPANION_ITEMS.length})
            </FilterChip>
            <FilterChip
              type="button"
              $active={filter === "main"}
              aria-pressed={filter === "main"}
              onClick={() => setFilter("main")}
            >
              Main Track ({COMPANION_ITEMS.filter((i) => i.track === "main").length})
            </FilterChip>
            <FilterChip
              type="button"
              $active={filter === "team"}
              aria-pressed={filter === "team"}
              onClick={() => setFilter("team")}
            >
              Team Track ({COMPANION_ITEMS.filter((i) => i.track === "team").length})
            </FilterChip>
          </FilterBar>

          <ItemsGrid>
            {filteredItems.map((item) => {
              const isUnlocked = companion.ownedItemIds.includes(item.id);
              const isEquipped = companion.equippedItemIds.includes(item.id);
              const costUnit = item.track === "main" ? "points" : "team stars";

              return (
                <ItemCard
                  key={item.id}
                  $equipped={isEquipped}
                  $unlocked={isUnlocked}
                  aria-label={`${item.name}, slot: ${item.slot}`}
                >
                  <Stack gap="xs">
                    <ItemHeader>
                      <SlotTag>{item.slot}</SlotTag>
                      <CostText>
                        {item.cost} {costUnit}
                      </CostText>
                    </ItemHeader>
                    <Heading level={3}>{item.name}</Heading>
                  </Stack>

                  {isEquipped ? (
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => actions.unequipItem(item.id)}
                      aria-label={`Unequip ${item.name}`}
                    >
                      Unequip
                    </Button>
                  ) : isUnlocked ? (
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => actions.equipItem(item.id)}
                      aria-label={`Equip ${item.name}`}
                    >
                      Equip
                    </Button>
                  ) : (
                    <LockedNotice>
                      Unlocks at {item.cost} {costUnit}
                    </LockedNotice>
                  )}
                </ItemCard>
              );
            })}
          </ItemsGrid>
        </Stack>

        {/* Badges */}
        <Stack gap="md">
          <Stack gap="xs">
            <Heading level={2}>Badges</Heading>
            <Text tone="muted">Achievements earned throughout your journey.</Text>
          </Stack>

          <BadgesGrid>
            {BADGES.map((badge) => {
              const isEarned = companion.badgeIds.includes(badge.id);

              return (
                <BadgeCard key={badge.id} $earned={isEarned}>
                  <BadgeHeader>
                    <BadgeIconContainer $earned={isEarned} aria-hidden="true">
                      {isEarned ? "★" : "○"}
                    </BadgeIconContainer>
                    <Chip
                      label={isEarned ? "Earned" : "In Progress"}
                      tone={isEarned ? "success" : "default"}
                    />
                  </BadgeHeader>
                  <Stack gap="xs">
                    <Heading level={3}>{badge.name}</Heading>
                    <Text size="sm" tone="muted">
                      {badge.description}
                    </Text>
                  </Stack>
                </BadgeCard>
              );
            })}
          </BadgesGrid>
        </Stack>
      </ScreenContainer>
    </Screen>
  );
}
