"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_NAME, ROUTES } from "@/config/app";
import { FIRE_MAX } from "@/config/economy";
import { coinBalance, getDragonEvolution } from "@/lib/economy";
import { todayKey } from "@/lib/dates";
import { useAppState } from "@/hooks/useAppState";
import { Button, Text } from "@/components/ui";
import { Companion } from "@/components/features/companion";
import { DynamicBackground } from "./DynamicBackground";
import {
  ActionButtonWrapper,
  ActionBtnContent,
  ActionBtnLabel,
  ActionIconWrapper,
  ActionsNav,
  ArrowSvg,
  BottomArea,
  CheckInArrowWrapper,
  CheckInBanner,
  CheckInIconWrapper,
  CheckInLeft,
  CheckInSubtitle,
  CheckInTextGroup,
  CheckInTitle,
  CheckSvg,
  CoinIconWrapper,
  CoinsPill,
  CoinsValue,
  CoinSvg,
  CustomizeSvg,
  DragonStage,
  DragonWrapper,
  FireBar,
  FireFill,
  FireTrack,
  FireValue,
  FlameIconWrapper,
  FlameSvg,
  FoodSvg,
  HomeScreenRoot,
  LoadingContainer,
  NavSvg,
  ParentDoorLink,
  ParentIconWrapper,
  ParentLabel,
  PlayButtonContainer,
  PlayContent,
  PlayLabel,
  PlayTriangleSvg,
  ShopSvg,
  SmallParentLink,
  StageBadge,
  StageBadgeIcon,
  StageBadgeText,
  StageNextText,
  StageTitleText,
  SvgCircle,
  SvgPath,
  SvgPolygon,
  TopBar,
  TopRightCluster,
} from "./HomeScreen.style";

export function HomeScreen() {
  const router = useRouter();
  const { state, isReady } = useAppState();
  const [companionPose, setCompanionPose] = useState<"idle" | "cheer">("idle");

  // If no child is configured, redirect to parent setup.
  // If device is parent-only, redirect straight to parent mode.
  useEffect(() => {
    if (!isReady) return;
    if (!state.child) {
      router.replace(ROUTES.parentSetup);
      return;
    }
    if (state.settings?.deviceRole === "parent") {
      router.replace(ROUTES.parent);
    }
  }, [isReady, state.child, state.settings?.deviceRole, router]);

  if (!isReady) {
    return (
      <LoadingContainer>
        <Text tone="muted">Loading {APP_NAME}...</Text>
      </LoadingContainer>
    );
  }

  if (!state.child || state.settings?.deviceRole === "parent") {
    return null;
  }

  const deviceRole = state.settings?.deviceRole ?? "both";
  const isChildOnly = deviceRole === "child";

  const companionName = state.companion?.name || "Kraków Dragon";
  const equippedItemIds = state.economy?.equippedItemIds ?? [];

  const fire = state.economy?.fire ?? 0;
  const coins = coinBalance(state);
  const firePercent = Math.min(100, Math.max(0, Math.round((fire / FIRE_MAX) * 100)));

  const evolution = getDragonEvolution(state.economy ?? { fire: 0 });

  const today = todayKey();
  const todayCheckIn = state.checkIns.find((item) => item.date === today);
  const isCheckInDone = Boolean(todayCheckIn);

  return (
    <HomeScreenRoot aria-label="Child Home Screen">
      {/* Full Screen Dynamic Sky Background with Drifting Clouds */}
      <DynamicBackground stage={evolution.stage} />

      {/* 1. Top bar: Fire bar, Coins pill, and discreet Parent mode link */}
      <TopBar>
        <FireBar aria-label={`Fire ${fire} of ${FIRE_MAX}`}>
          <FlameIconWrapper aria-hidden="true">
            <FlameSvg viewBox="0 0 24 24" fill="currentColor">
              <SvgPath d="M12 23C7.5 23 4 19.5 4 15C4 11.5 6.5 8 9 5C9 8 11 9 12 9C13 9 14.5 7.5 14.5 5.5C17.5 8 20 11.5 20 15C20 19.5 16.5 23 12 23Z" />
            </FlameSvg>
          </FlameIconWrapper>
          <FireTrack>
            <FireFill $percent={firePercent} />
          </FireTrack>
          <FireValue>{fire}</FireValue>
        </FireBar>

        <TopRightCluster>
          <CoinsPill aria-label={`Coins ${coins}`}>
            <CoinIconWrapper aria-hidden="true">
              <CoinSvg viewBox="0 0 24 24" fill="currentColor">
                <SvgCircle cx="12" cy="12" r="10" />
                <SvgCircle cx="12" cy="12" r="7" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
                <SvgPath
                  d="M12 7.5V16.5M9.5 9.5H14.5M9.5 14.5H14.5"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </CoinSvg>
            </CoinIconWrapper>
            <CoinsValue>{coins}</CoinsValue>
          </CoinsPill>

          {!isChildOnly && (
            <ParentDoorLink href={ROUTES.parent} aria-label="Parent mode">
              <ParentIconWrapper aria-hidden="true">
                <NavSvg viewBox="0 0 24 24" fill="currentColor">
                  <SvgPath d="M12 2C9.24 2 7 4.24 7 7V9H6C4.9 9 4 9.9 4 11V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V11C20 9.9 19.1 9 18 9H17V7C17 4.24 14.76 2 12 2ZM9 7C9 5.34 10.34 4 12 4C13.66 4 15 5.34 15 7V9H9V7ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17Z" />
                </NavSvg>
              </ParentIconWrapper>
              <ParentLabel>Parents</ParentLabel>
            </ParentDoorLink>
          )}
        </TopRightCluster>
      </TopBar>

      {/* 2. Middle: Large Centered Companion Mascot with Evolution Stage Badge */}
      <DragonStage aria-label="Mascot Stage">
        <StageBadge
          aria-label={`Evolution: ${evolution.title}`}
          data-testid="evolution-stage-badge"
        >
          <StageBadgeIcon aria-hidden="true">
            {evolution.stage === 1 ? "🌱" : evolution.stage === 2 ? "⚡" : "👑"}
          </StageBadgeIcon>
          <StageBadgeText>
            <StageTitleText>{evolution.title}</StageTitleText>
            {evolution.nextThreshold ? (
              <StageNextText>{evolution.fireNeededForNext} 🔥 to evolve</StageNextText>
            ) : (
              <StageNextText>Max level!</StageNextText>
            )}
          </StageBadgeText>
        </StageBadge>

        <DragonWrapper>
          <Companion
            pose={companionPose}
            equippedItemIds={equippedItemIds}
            name={companionName}
            size="lg"
            onTap={() => {
              setCompanionPose("cheer");
              setTimeout(() => setCompanionPose("idle"), 1200);
            }}
          />
        </DragonWrapper>
      </DragonStage>

      {/* 3. Bottom: Check-in (if not done), Play button, and Game Navigation Row */}
      <BottomArea aria-label="Game controls">
        {!isCheckInDone && (
          <CheckInBanner
            href={ROUTES.checkIn}
            aria-label="Daily Check-in"
            data-testid="nav-check-in"
          >
            <CheckInLeft>
              <CheckInIconWrapper aria-hidden="true">
                <CheckSvg viewBox="0 0 24 24" fill="none">
                  <SvgCircle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" />
                  <SvgPath
                    d="M8.5 12L11 14.5L16 9"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </CheckSvg>
              </CheckInIconWrapper>
              <CheckInTextGroup>
                <CheckInTitle>Daily Check-in</CheckInTitle>
                <CheckInSubtitle>Tell us how you feel today</CheckInSubtitle>
              </CheckInTextGroup>
            </CheckInLeft>
            <CheckInArrowWrapper aria-hidden="true">
              <ArrowSvg viewBox="0 0 24 24" fill="currentColor">
                <SvgPath d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </ArrowSvg>
            </CheckInArrowWrapper>
          </CheckInBanner>
        )}

        {/* Big PLAY button (accent variant of Button) linking to ROUTES.play */}
        <PlayButtonContainer>
          <Button
            variant="accent"
            fullWidth
            aria-label="Play"
            data-testid="home-play-button"
            onClick={() => router.push(ROUTES.play)}
          >
            <PlayContent>
              <PlayTriangleSvg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <SvgPolygon points="7,4 20,12 7,20" />
              </PlayTriangleSvg>
              <PlayLabel>PLAY</PlayLabel>
            </PlayContent>
          </Button>
        </PlayButtonContainer>

        {/* Row of three buttons: Shop, Food, Customize */}
        <ActionsNav aria-label="Game navigation">
          <ActionButtonWrapper>
            <Button
              variant="secondary"
              fullWidth
              aria-label="Shop"
              data-testid="nav-shop"
              onClick={() => router.push(ROUTES.shop)}
            >
              <ActionBtnContent>
                <ActionIconWrapper aria-hidden="true">
                  <ShopSvg viewBox="0 0 24 24" fill="currentColor">
                    <SvgPath d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z" />
                  </ShopSvg>
                </ActionIconWrapper>
                <ActionBtnLabel>Shop</ActionBtnLabel>
              </ActionBtnContent>
            </Button>
          </ActionButtonWrapper>

          <ActionButtonWrapper>
            <Button
              variant="secondary"
              fullWidth
              aria-label="Food"
              data-testid="nav-food"
              onClick={() => router.push(ROUTES.food)}
            >
              <ActionBtnContent>
                <ActionIconWrapper aria-hidden="true">
                  <FoodSvg viewBox="0 0 24 24" fill="currentColor">
                    <SvgPath d="M12 2C11.5 2 11 2.5 11 3v1.1C7.6 4.6 5 7.5 5 11v1h14v-1c0-3.5-2.6-6.4-6-6.9V3c0-.5-.5-1-1-1zM4 14c0 3.3 2.7 6 6 6h4c3.3 0 6-2.7 6-6H4z" />
                  </FoodSvg>
                </ActionIconWrapper>
                <ActionBtnLabel>Food</ActionBtnLabel>
              </ActionBtnContent>
            </Button>
          </ActionButtonWrapper>

          <ActionButtonWrapper>
            <Button
              variant="secondary"
              fullWidth
              aria-label="Customize"
              data-testid="nav-customize"
              onClick={() => router.push(ROUTES.customize)}
            >
              <ActionBtnContent>
                <ActionIconWrapper aria-hidden="true">
                  <CustomizeSvg viewBox="0 0 24 24" fill="currentColor">
                    <SvgPath d="M16 2l4 4-2.5 2.5L16 7.5V22H8V7.5L6.5 8.5 4 6l4-4 2.5 1.5c.9.5 2.1.5 3 0L16 2z" />
                  </CustomizeSvg>
                </ActionIconWrapper>
                <ActionBtnLabel>Customize</ActionBtnLabel>
              </ActionBtnContent>
            </Button>
          </ActionButtonWrapper>
        </ActionsNav>
      </BottomArea>

      {deviceRole === "child" || deviceRole === "both" ? (
        <SmallParentLink href={ROUTES.share} aria-label="Show parents">
          Show parents
        </SmallParentLink>
      ) : null}
      {isChildOnly ? (
        <SmallParentLink href={ROUTES.parent} aria-label="Parent mode">
          Parent mode
        </SmallParentLink>
      ) : null}
    </HomeScreenRoot>
  );
}
