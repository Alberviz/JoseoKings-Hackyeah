"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/app";
import { useAppState } from "@/hooks/useAppState";
import { Text } from "@/components/ui";
import { Companion } from "@/components/features/companion";
import {
  BottomNavArea,
  CenterFocusArea,
  DragonAnchor,
  HomeScreenRoot,
  LoadingContainer,
  NavIconWrapper,
  NavLabel,
  NavLink,
  NavSvg,
  ParentDoorLink,
  PlayButton,
  PlayTriangleSvg,
  SvgCircle,
  SvgPath,
  SvgPolygon,
  TopBar,
} from "./HomeScreen.style";

export function HomeScreen() {
  const router = useRouter();
  const { state, isReady } = useAppState();

  // If no child is configured, redirect to parent setup ONLY when isReady is true
  useEffect(() => {
    if (!isReady) return;
    if (!state.child) {
      router.replace(ROUTES.parentSetup);
    }
  }, [isReady, state.child, router]);

  if (!isReady) {
    return (
      <LoadingContainer>
        <Text tone="muted">Loading CrohnCare...</Text>
      </LoadingContainer>
    );
  }

  if (!state.child) {
    return null;
  }

  const companionName = state.companion?.name || "Kraków Dragon";
  const equippedItemIds = state.companion?.equippedItemIds || [];

  return (
    <HomeScreenRoot aria-label="Child Home Screen">
      {/* 1. Top bar: Discreet Parent Door */}
      <TopBar>
        <ParentDoorLink href={ROUTES.parent} aria-label="Parent mode">
          <NavIconWrapper aria-hidden="true">
            <NavSvg viewBox="0 0 24 24" fill="currentColor">
              {/* Discreet door / lock shield icon */}
              <SvgPath d="M12 2C9.24 2 7 4.24 7 7V9H6C4.9 9 4 9.9 4 11V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V11C20 9.9 19.1 9 18 9H17V7C17 4.24 14.76 2 12 2ZM9 7C9 5.34 10.34 4 12 4C13.66 4 15 5.34 15 7V9H9V7ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17Z" />
            </NavSvg>
          </NavIconWrapper>
          Parents
        </ParentDoorLink>
      </TopBar>

      {/* 2. Middle: Large Centered Dragon Mascot & Play Button */}
      <CenterFocusArea aria-label="Mascot Stage">
        <DragonAnchor>
          <Companion pose="idle" equippedItemIds={equippedItemIds} name={companionName} size="lg" />

          {/* Central/lower Play button leading to missions */}
          <PlayButton
            type="button"
            aria-label="Start mission"
            data-testid="home-play-button"
            onClick={() => router.push(ROUTES.missions)}
          >
            <PlayTriangleSvg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <SvgPolygon points="7,4 20,12 7,20" fill="#FFFFFF" />
            </PlayTriangleSvg>
          </PlayButton>
        </DragonAnchor>
      </CenterFocusArea>

      {/* 3. Bottom: Child Navigation Menu */}
      <BottomNavArea aria-label="Child Navigation">
        {/* Check-in */}
        <NavLink href={ROUTES.checkIn} aria-label="Daily Check-in" data-testid="nav-check-in">
          <NavIconWrapper aria-hidden="true">
            <NavSvg viewBox="0 0 24 24" fill="currentColor">
              {/* Friendly checkmark badge */}
              <SvgCircle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              />
              <SvgPath
                d="M8.5 12L11 14.5L16 9"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </NavSvg>
          </NavIconWrapper>
          <NavLabel>Check-in</NavLabel>
        </NavLink>

        {/* Missions */}
        <NavLink href={ROUTES.missions} aria-label="Missions" data-testid="nav-missions">
          <NavIconWrapper aria-hidden="true">
            <NavSvg viewBox="0 0 24 24" fill="currentColor">
              {/* Compass / target star for missions */}
              <SvgPath d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </NavSvg>
          </NavIconWrapper>
          <NavLabel>Missions</NavLabel>
        </NavLink>

        {/* Customize Companion */}
        <NavLink
          href={ROUTES.companion}
          aria-label="Customize companion"
          data-testid="nav-companion"
        >
          <NavIconWrapper aria-hidden="true">
            <NavSvg viewBox="0 0 24 24" fill="currentColor">
              {/* Magic sparkle star for customization */}
              <SvgPath d="M12 3C12 7 14.5 9.5 18.5 9.5C14.5 9.5 12 12 12 16C12 12 9.5 9.5 5.5 9.5C9.5 9.5 12 7 12 3Z" />
              <SvgPath d="M18 14C18 15.5 19 16.5 20.5 16.5C19 16.5 18 17.5 18 19C18 17.5 17 16.5 15.5 16.5C17 16.5 18 15.5 18 14Z" />
            </NavSvg>
          </NavIconWrapper>
          <NavLabel>Customize</NavLabel>
        </NavLink>
      </BottomNavArea>
    </HomeScreenRoot>
  );
}
