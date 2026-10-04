"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_NAME, ROUTES } from "@/config/app";
import { FIRE_MAX } from "@/config/economy";
import { coinBalance, getDragonEvolution } from "@/lib/economy";
import { todayKey } from "@/lib/dates";
import { useAppState } from "@/hooks/useAppState";
import { Text } from "@/components/ui";
import { Companion } from "@/components/features/companion";
import { CheckInBubble } from "./CheckInBubble";
import { DynamicBackground } from "./DynamicBackground";
import { FireMeter } from "./FireMeter";
import { GameTabBar } from "./GameTabBar";
import { HomeIcon } from "./HomeIcons";
import {
  CoinsPill,
  CoinsValue,
  DragonFrame,
  DragonStage,
  HomeColumn,
  HomeScreenRoot,
  IconSlot,
  LoadingContainer,
  NameTag,
  NameTagNext,
  NameTagTitle,
  ParentDoorLink,
  PlayIconSlot,
  PlayLink,
  TopBar,
} from "./HomeScreen.style";

export function HomeScreen() {
  const router = useRouter();
  const { state, isReady } = useAppState();
  const [companionPose, setCompanionPose] = useState<"idle" | "cheer">("idle");
  const poseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const timeoutRef = poseTimeoutRef;
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    };
  }, []);

  // If no child is configured, redirect to parent setup.
  useEffect(() => {
    if (!isReady) return;
    if (!state.child) {
      router.replace(ROUTES.parentSetup);
    }
  }, [isReady, state.child, router]);

  if (!isReady) {
    return (
      <LoadingContainer>
        <Text tone="muted">Loading {APP_NAME}...</Text>
      </LoadingContainer>
    );
  }

  if (!state.child) {
    return null;
  }

  const companionName = state.companion?.name || "Kraków Dragon";
  const equippedItemIds = state.economy?.equippedItemIds ?? [];

  const fire = state.economy?.fire ?? 0;
  const coins = coinBalance(state);

  const evolution = getDragonEvolution(state.economy ?? { fire: 0 });

  const today = todayKey();
  const isCheckInDone = state.checkIns.some((item) => item.date === today);

  return (
    <HomeScreenRoot aria-label="Child Home Screen">
      {/* Full screen sky with drifting clouds */}
      <DynamicBackground stage={evolution.stage} />

      <HomeColumn>
        {/* 1. Top row: fire meter (stretches), coins, and the way to the parents' area */}
        <TopBar>
          <FireMeter fire={fire} max={FIRE_MAX} />

          <CoinsPill aria-label={`Coins ${coins}`}>
            <IconSlot aria-hidden="true">
              <HomeIcon iconKey="coin" size={24} />
            </IconSlot>
            <CoinsValue>{coins}</CoinsValue>
          </CoinsPill>

          <ParentDoorLink href={ROUTES.parent} aria-label="Parent mode">
            <HomeIcon iconKey="lock" size={28} />
          </ParentDoorLink>
        </TopBar>

        {/* 2. Dragon stage: check-in bubble (or done chip), the dragon and its name tag */}
        <DragonStage aria-label="Mascot Stage">
          <CheckInBubble isDone={isCheckInDone} />

          <DragonFrame>
            <Companion
              pose={companionPose}
              equippedItemIds={equippedItemIds}
              name={companionName}
              size="fill"
              stage={evolution.stage}
              onTap={() => {
                setCompanionPose("cheer");
                if (poseTimeoutRef.current !== null) clearTimeout(poseTimeoutRef.current);
                poseTimeoutRef.current = window.setTimeout(() => setCompanionPose("idle"), 1200);
              }}
            />
          </DragonFrame>

          <NameTag aria-label={`Evolution: ${evolution.title}`} data-testid="evolution-stage-badge">
            <NameTagTitle>{evolution.title}</NameTagTitle>
            <NameTagNext>
              {evolution.nextThreshold
                ? `${evolution.fireNeededForNext} fire to grow`
                : "Max level!"}
            </NameTagNext>
          </NameTag>
        </DragonStage>

        {/* 3. Big PLAY button */}
        <PlayLink href={ROUTES.play} aria-label="Play" data-testid="home-play-button">
          <PlayIconSlot aria-hidden="true">
            <HomeIcon iconKey="play" />
          </PlayIconSlot>
          PLAY
        </PlayLink>

        {/* 4. Game bar: Shop, Food, Dress up */}
        <GameTabBar />
      </HomeColumn>
    </HomeScreenRoot>
  );
}
