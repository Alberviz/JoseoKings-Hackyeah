import styled, { keyframes } from "styled-components";
import type { CompanionSize } from "./Companion";

const sizeMap: Record<CompanionSize, string> = {
  sm: "96px",
  md: "160px",
  lg: "240px",
};

// --- Keyframes for Poses ---

const idleFloat = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
`;

const idleBlink = keyframes`
  0%, 90%, 100% {
    transform: scaleY(1);
  }
  95% {
    transform: scaleY(0.1);
  }
`;

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

const cheerBounce = keyframes`
  0%, 100% {
    transform: translateY(0px) scale(1, 1);
  }
  50% {
    transform: translateY(-14px) scale(1.04, 0.96);
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

// --- Styled SVG Components ---

export const StyledCompanionSvg = styled.svg<{ $size: CompanionSize }>`
  display: block;
  flex-shrink: 0;
  width: ${({ $size }) => sizeMap[$size]};
  height: ${({ $size }) => sizeMap[$size]};
  max-width: 100%;
  overflow: visible;

  @media (prefers-reduced-motion: reduce) {
    &,
    & * {
      animation: none !important;
    }
  }
`;

export const SvgG = styled.g``;
export const SvgPath = styled.path``;
export const SvgCircle = styled.circle``;
export const SvgEllipse = styled.ellipse``;
export const SvgRect = styled.rect``;
export const SvgPolygon = styled.polygon``;

// --- Animated Groups ---

export const AnimatedIdleG = styled.g`
  transform-origin: 100px 100px;
  animation: ${idleFloat} 3.2s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const AnimatedEyesG = styled.g`
  transform-origin: 100px 92px;
  animation: ${idleBlink} 4.5s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const AnimatedBreatheG = styled.g`
  transform-origin: 100px 110px;
  animation: ${breatheScale} 4.8s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const AnimatedStretchG = styled.g`
  transform-origin: 100px 140px;
  animation: ${stretchSway} 3.6s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const AnimatedBalanceG = styled.g`
  transform-origin: 106px 155px;
  animation: ${balanceSway} 2.6s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const AnimatedStrengthG = styled.g`
  transform-origin: 100px 140px;
  animation: ${strengthPulse} 2.4s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const AnimatedCheerG = styled.g`
  transform-origin: 100px 150px;
  animation: ${cheerBounce} 0.85s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const AnimatedCheerArmsG = styled.g`
  transform-origin: 100px 85px;
  animation: ${cheerArmsWave} 0.85s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
