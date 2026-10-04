import styled, { css, keyframes } from "styled-components";
import type { DragonStageId } from "@/types";

/* --- Keyframe Animations --- */

const floatCloud = keyframes`
  0% {
    transform: translate3d(-140%, 0, 0);
  }
  100% {
    transform: translate3d(240%, 0, 0);
  }
`;

const pulseSparkle = keyframes`
  0%, 100% {
    opacity: 0.15;
    transform: scale(0.7) rotate(0deg);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.15) rotate(180deg);
  }
`;

const riseEmber = keyframes`
  0% {
    transform: translate3d(0, 40px, 0) scale(0.6);
    opacity: 0;
  }
  30% {
    opacity: 0.8;
  }
  80% {
    opacity: 0.6;
  }
  100% {
    transform: translate3d(20px, -260px, 0) scale(1.1);
    opacity: 0;
  }
`;

const auroraWave = keyframes`
  0%, 100% {
    transform: translate3d(-4%, 0, 0) scaleY(1);
    opacity: 0.35;
  }
  50% {
    transform: translate3d(4%, -10px, 0) scaleY(1.15);
    opacity: 0.6;
  }
`;

/* --- Full Screen Background Container --- */

export const BackgroundContainer = styled.div<{ $stage: DragonStageId }>`
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  transition: background 600ms ease;

  ${({ $stage, theme }) => {
    switch ($stage) {
      case 2:
        return css`
          background: linear-gradient(
            175deg,
            ${theme.colors.dragonHornHighlight} 0%,
            ${theme.colors.dragonCheek} 45%,
            ${theme.colors.paper} 100%
          );
        `;
      case 3:
        return css`
          background: linear-gradient(
            175deg,
            ${theme.colors.ink} 0%,
            ${theme.colors.playButton} 50%,
            ${theme.colors.lavender} 100%
          );
        `;
      case 1:
      default:
        return css`
          background: linear-gradient(
            175deg,
            ${theme.colors.childHomeBg} 0%,
            ${theme.colors.mint} 55%,
            ${theme.colors.surface} 100%
          );
        `;
    }
  }}
`;

/* --- Stage 3: Ethereal Aurora Borealis Layer --- */

export const AuroraLayer = styled.div`
  position: absolute;
  top: 0;
  left: -20%;
  width: 140%;
  height: 48%;
  background: radial-gradient(
    ellipse at 50% 30%,
    rgba(198, 181, 232, 0.45) 0%,
    rgba(54, 197, 212, 0.25) 45%,
    transparent 80%
  );
  filter: blur(28px);
  animation: ${auroraWave} 14s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0.4;
  }
`;

/* --- Gentle Drifting Clouds --- */

export const CloudGroup = styled.div<{
  $top: number;
  $scale: number;
  $durationSec: number;
  $delaySec: number;
  $opacity: number;
}>`
  position: absolute;
  top: ${({ $top }) => `${$top}%`};
  left: 0;
  width: 180px;
  height: 90px;
  opacity: ${({ $opacity }) => $opacity};
  transform-origin: center center;
  animation: ${floatCloud} ${({ $durationSec }) => `${$durationSec}s`} linear infinite;
  animation-delay: ${({ $delaySec }) => `${$delaySec}s`};
  will-change: transform;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transform: translate3d(0, 0, 0);
  }
`;

export const CloudItem = styled.div`
  width: 100%;
  height: 100%;
`;

export const CloudSvg = styled.svg`
  width: 100%;
  height: 100%;
  display: block;
`;

export const SvgCloudPath = styled.path<{ $stage: DragonStageId }>`
  fill: ${({ $stage }) =>
    $stage === 3
      ? "rgba(198, 181, 232, 0.35)"
      : $stage === 2
        ? "rgba(255, 245, 230, 0.82)"
        : "rgba(255, 255, 255, 0.78)"};
  filter: ${({ $stage, theme }) =>
    $stage === 3
      ? `drop-shadow(0 4px 12px ${theme.colors.ink})`
      : "drop-shadow(0 2px 8px rgba(18, 119, 130, 0.08))"};
`;

/* --- Ambient Particles: Sparkles for Stage 1 & 2 --- */

export const SparkleGroup = styled.div<{
  $top: number;
  $left: number;
  $size: number;
  $delaySec: number;
}>`
  position: absolute;
  top: ${({ $top }) => `${$top}%`};
  left: ${({ $left }) => `${$left}%`};
  width: ${({ $size }) => `${$size}px`};
  height: ${({ $size }) => `${$size}px`};
  animation: ${pulseSparkle} 4s ease-in-out infinite;
  animation-delay: ${({ $delaySec }) => `${$delaySec}s`};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0.5;
  }
`;

export const SparkleItem = styled.div`
  width: 100%;
  height: 100%;
`;

export const SparkleSvg = styled.svg`
  width: 100%;
  height: 100%;
  display: block;
`;

export const SvgSparklePath = styled.path<{ $stage: DragonStageId }>`
  fill: ${({ $stage, theme }) => ($stage === 2 ? theme.colors.highlight : theme.colors.dragonBody)};
`;

/* --- Ambient Particles: Rising Embers for Stage 3 --- */

export const EmberGroup = styled.div<{
  $bottom: number;
  $left: number;
  $size: number;
  $durationSec: number;
  $delaySec: number;
}>`
  position: absolute;
  bottom: ${({ $bottom }) => `${$bottom}%`};
  left: ${({ $left }) => `${$left}%`};
  width: ${({ $size }) => `${$size}px`};
  height: ${({ $size }) => `${$size}px`};
  animation: ${riseEmber} ${({ $durationSec }) => `${$durationSec}s`} ease-out infinite;
  animation-delay: ${({ $delaySec }) => `${$delaySec}s`};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0.4;
  }
`;

export const EmberItem = styled.div`
  width: 100%;
  height: 100%;
`;

export const EmberSvg = styled.svg`
  width: 100%;
  height: 100%;
  display: block;
`;

export const SvgEmberCircle = styled.circle`
  fill: ${({ theme }) => theme.colors.accent};
  filter: drop-shadow(0 0 6px ${({ theme }) => theme.colors.highlight});
`;
