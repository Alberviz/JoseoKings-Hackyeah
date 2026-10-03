import styled, { css, keyframes } from "styled-components";
import type { CompanionSize } from "./Companion";

const sizeMap: Record<CompanionSize, string> = {
  sm: "96px",
  md: "160px",
  lg: "240px",
};

// --- Keyframes for Idle & Parts Animations ---

const idleBodyBreathe = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-3px);
  }
`;

const idleBellyBreathe = keyframes`
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(1.03);
  }
`;

const idleBlink = keyframes`
  0%, 90%, 100% {
    transform: scaleY(1);
  }
  95% {
    transform: scaleY(0.08);
  }
`;

const leftWingIdle = keyframes`
  0%, 100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(-6deg);
  }
`;

const rightWingIdle = keyframes`
  0%, 100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(6deg);
  }
`;

const tailSwing = keyframes`
  0%, 100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(7deg);
  }
`;

const headTilt = keyframes`
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-2.5deg);
  }
  50% {
    transform: rotate(0deg);
  }
  75% {
    transform: rotate(2.5deg);
  }
`;

// --- Keyframes for Cheer Pose ---

const cheerSquatStretch = keyframes`
  0% {
    transform: scale(1, 1) translateY(0);
  }
  20% {
    transform: scale(1.04, 0.92) translateY(2px);
  }
  55% {
    transform: scale(0.96, 1.08) translateY(-12px);
  }
  80% {
    transform: scale(1.01, 0.98) translateY(1px);
  }
  100% {
    transform: scale(1, 1) translateY(0);
  }
`;

const leftWingCheer = keyframes`
  0% {
    transform: rotate(0deg);
  }
  20% {
    transform: rotate(4deg);
  }
  55% {
    transform: rotate(-28deg);
  }
  80% {
    transform: rotate(-22deg);
  }
  100% {
    transform: rotate(-25deg);
  }
`;

const rightWingCheer = keyframes`
  0% {
    transform: rotate(0deg);
  }
  20% {
    transform: rotate(-4deg);
  }
  55% {
    transform: rotate(28deg);
  }
  80% {
    transform: rotate(22deg);
  }
  100% {
    transform: rotate(24deg);
  }
`;

const cheerArmsWave = keyframes`
  0%, 100% {
    transform: rotate(-10deg);
  }
  50% {
    transform: rotate(10deg);
  }
`;

// --- Keyframes for Exercise Mission Poses ---

const breatheScale = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.07);
  }
`;

const stretchSway = keyframes`
  0%, 100% {
    transform: rotate(-6deg);
  }
  50% {
    transform: rotate(6deg);
  }
`;

const balanceSway = keyframes`
  0%, 100% {
    transform: rotate(-3deg);
  }
  50% {
    transform: rotate(3deg);
  }
`;

const strengthPulse = keyframes`
  0%, 100% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(4px) scale(0.98, 0.99);
  }
`;

// --- Styled SVG Components ---

export const StyledCompanionSvg = styled.svg<{
  $size: CompanionSize;
  $animated?: boolean;
}>`
  display: block;
  flex-shrink: 0;
  width: ${({ $size }) => sizeMap[$size]};
  height: ${({ $size }) => sizeMap[$size]};
  max-width: 100%;
  overflow: visible;

  ${({ $animated }) =>
    $animated === false &&
    `
    &,
    & * {
      animation: none !important;
      transition: none !important;
    }
  `}

  @media (prefers-reduced-motion: reduce) {
    &,
    & * {
      animation: none !important;
      transition: none !important;
    }
  }
`;

export const SvgG = styled.g``;
export const SvgPath = styled.path``;
export const SvgCircle = styled.circle``;
export const SvgEllipse = styled.ellipse``;
export const SvgRect = styled.rect``;
export const SvgPolygon = styled.polygon``;

// --- Animated SVG Groups by Part ---

export const AnimatedIdleG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: ${idleBodyBreathe} 3.5s ease-in-out infinite;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedBellyG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: ${idleBellyBreathe} 3.5s ease-in-out infinite;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedLeftWingG = styled.g<{ $animated?: boolean; $isCheer?: boolean }>`
  transform-box: fill-box;
  transform-origin: 90% 50%;
  animation: ${({ $isCheer }) =>
    $isCheer
      ? css`
          ${leftWingCheer} 0.95s ease-in-out forwards
        `
      : css`
          ${leftWingIdle} 3s ease-in-out infinite
        `};

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedRightWingG = styled.g<{ $animated?: boolean; $isCheer?: boolean }>`
  transform-box: fill-box;
  transform-origin: 10% 50%;
  animation: ${({ $isCheer }) =>
    $isCheer
      ? css`
          ${rightWingCheer} 0.95s ease-in-out forwards
        `
      : css`
          ${rightWingIdle} 3s ease-in-out infinite
        `};

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedTailG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 5% 85%;
  animation: ${tailSwing} 3.5s ease-in-out 150ms infinite;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedHeadG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 50% 90%;
  animation: ${headTilt} 4s ease-in-out infinite;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedEyesG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 50% 50%;
  animation: ${idleBlink} 5s ease-in-out infinite;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedCheerG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: ${cheerSquatStretch} 0.95s ease-in-out forwards;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedCheerArmsG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 50% 70%;
  animation: ${cheerArmsWave} 0.85s ease-in-out infinite;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedBreatheG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 50% 60%;
  animation: ${breatheScale} 4.8s ease-in-out infinite;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedStretchG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 50% 90%;
  animation: ${stretchSway} 3.6s ease-in-out infinite;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedBalanceG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 53% 100%;
  animation: ${balanceSway} 2.6s ease-in-out infinite;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedStrengthG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 50% 90%;
  animation: ${strengthPulse} 2.4s ease-in-out infinite;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;
