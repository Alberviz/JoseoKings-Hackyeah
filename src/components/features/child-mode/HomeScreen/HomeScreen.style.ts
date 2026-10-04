import Link from "next/link";
import styled, { keyframes } from "styled-components";

const COLUMN_GAP = "clamp(8px, 1.6dvh, 14px)";

const wiggle = keyframes`
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-9deg) scale(1.06);
  }
  75% {
    transform: rotate(9deg) scale(1.06);
  }
`;

const shine = keyframes`
  0% {
    transform: translateX(-160%) skewX(-20deg);
  }
  40%,
  100% {
    transform: translateX(420%) skewX(-20deg);
  }
`;

export const HomeScreenRoot = styled.main`
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0;
  background: transparent;
  overflow-x: hidden;
  box-sizing: border-box;
  user-select: none;
`;

// One centred column. The bar at the bottom is part of the flow, so nothing is ever covered.
export const HomeColumn = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${COLUMN_GAP};
  width: 100%;
  max-width: 480px;
  min-height: 100vh;
  min-height: 100dvh;
  padding: calc(14px + env(safe-area-inset-top, 0px)) ${({ theme }) => theme.spacing.md}
    calc(12px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
`;

export const TopBar = styled.header`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  min-height: ${({ theme }) => theme.touchTarget};
`;

export const CoinsPill = styled.div`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 12px 0 8px;
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.pill};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
  box-sizing: border-box;
  cursor: pointer;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    background-color 120ms ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primarySoft};
  }

  &:active {
    transform: translate(2px, 3px);
    box-shadow: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const CoinsValue = styled.span`
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  line-height: 1;
  color: ${({ theme }) => theme.colors.ink};
`;

export const IconSlot = styled.span`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
`;

// Round sticker with a padlock: the way to the parents' area. No text, the label is for screen readers.
export const ParentDoorLink = styled(Link)`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.touchTarget};
  height: ${({ theme }) => theme.touchTarget};
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.pill};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    background-color 120ms ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primarySoft};
  }

  &:active {
    transform: translate(2px, 3px);
    box-shadow: none;
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 3px;
  }

  &:hover svg,
  &:focus-visible svg {
    animation: ${wiggle} 500ms ease-in-out;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover svg,
    &:focus-visible svg {
      animation: none;
    }
  }
`;

export const DragonStage = styled.section`
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 0;
`;

// The dragon fills this box, and the box follows the free height and width of the phone.
export const DragonFrame = styled.div`
  position: relative;
  flex-shrink: 1;
  width: clamp(160px, min(44dvh, 84vw), 420px);
  filter: drop-shadow(0 14px 24px rgba(18, 119, 130, 0.22));
`;

export const NameTag = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-top: -6px;
  padding: 5px 18px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1.5px solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.lg};
  text-align: center;
  line-height: 1.15;
`;

export const NameTagTitle = styled.span`
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.ink};
`;

export const NameTagNext = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const PlayLink = styled(Link)`
  position: relative;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  height: clamp(56px, 8dvh, 72px);
  overflow: hidden;
  background: ${({ theme }) => theme.colors.accent};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
  box-sizing: border-box;
  color: ${({ theme }) => theme.colors.onAccent};
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: clamp(1.25rem, 3.4dvh, 1.625rem);
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  letter-spacing: 0.08em;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    filter 120ms ease;

  /* A soft light sweeps from left to right every few seconds. */
  &::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 28%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      ${({ theme }) => theme.colors.surface}A6 50%,
      transparent 100%
    );
    pointer-events: none;
    animation: ${shine} 3.6s ease-in-out infinite;
  }

  &:hover {
    filter: brightness(1.04);
  }

  &:active {
    transform: translate(2px, 3px);
    box-shadow: none;
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 3px;
  }

  &:hover svg,
  &:focus-visible svg {
    animation: ${wiggle} 500ms ease-in-out;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &::after {
      display: none;
      animation: none;
    }

    &:hover svg,
    &:focus-visible svg {
      animation: none;
    }
  }
`;

export const PlayIconSlot = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;

  & svg {
    width: clamp(24px, 3.8dvh, 32px);
    height: clamp(24px, 3.8dvh, 32px);
  }
`;

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.childHomeBg};
`;
