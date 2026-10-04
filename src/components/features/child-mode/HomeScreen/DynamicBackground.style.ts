import styled, { css, keyframes } from "styled-components";
import type { DragonStageId } from "@/types";

/* --- Keyframe Animations --- */

// Percentages in translate refer to the cloud's own width, so a cloud always starts fully
// off the left edge and ends fully off the right edge, whatever the viewport size.
const floatCloud = keyframes`
  0% {
    transform: translate3d(-130%, 0, 0);
  }
  100% {
    transform: translate3d(calc(100vw + 30%), 0, 0);
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
    transform: translate3d(0, 4dvh, 0) scale(0.6);
    opacity: 0;
  }
  30% {
    opacity: 0.8;
  }
  80% {
    opacity: 0.6;
  }
  100% {
    transform: translate3d(3vw, -32dvh, 0) scale(1.1);
    opacity: 0;
  }
`;

const auroraWave = keyframes`
  0%, 100% {
    transform: translate3d(-4%, 0, 0) scaleY(1);
    opacity: 0.35;
  }
  50% {
    transform: translate3d(4%, -2dvh, 0) scaleY(1.15);
    opacity: 0.6;
  }
`;

/* --- Full Screen Background Container --- */

export const BackgroundContainer = styled.div<{ $stage: DragonStageId }>`
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100vh;
  height: 100dvh;
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

// The gradient reaches full transparency before the edges of the box (closest-side), so the
// blur never reveals a hard edge.
export const AuroraLayer = styled.div`
  position: absolute;
  top: 0;
  left: -20%;
  width: 140%;
  height: 48%;
  background: radial-gradient(
    ellipse closest-side at 50% 42%,
    ${({ theme }) => `color-mix(in srgb, ${theme.colors.lavender} 45%, transparent)`} 0%,
    ${({ theme }) => `color-mix(in srgb, ${theme.colors.dragonBody} 25%, transparent)`} 55%,
    transparent 100%
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
  $restLeft: number;
}>`
  position: absolute;
  top: ${({ $top }) => `${$top}%`};
  left: 0;
  width: ${({ $scale }) => `calc(clamp(120px, 42vw, 300px) * ${$scale})`};
  aspect-ratio: 188 / 108;
  opacity: ${({ $opacity }) => $opacity};
  animation: ${floatCloud} ${({ $durationSec }) => `${$durationSec}s`} linear infinite;
  animation-delay: ${({ $delaySec }) => `${$delaySec}s`};
  will-change: transform;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    left: ${({ $restLeft }) => `${$restLeft}%`};
    transform: none;
    will-change: auto;
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
  overflow: visible;
`;

const cloudFill = (
  stage: DragonStageId,
  colors: { surface: string; paper: string; lavender: string },
) => {
  switch (stage) {
    case 3:
      return `color-mix(in srgb, ${colors.lavender} 38%, transparent)`;
    case 2:
      return `color-mix(in srgb, ${colors.paper} 85%, transparent)`;
    case 1:
    default:
      return `color-mix(in srgb, ${colors.surface} 80%, transparent)`;
  }
};

// The soft rim: the same outline drawn a bit wider and fainter under the cloud body. It gives
// the silhouette a feathered edge without any filter, so nothing is clipped by a box.
export const CloudHalo = styled.path<{ $stage: DragonStageId }>`
  fill: ${({ $stage, theme }) => cloudFill($stage, theme.colors)};
  stroke: ${({ $stage, theme }) => cloudFill($stage, theme.colors)};
  stroke-width: 10;
  stroke-linejoin: round;
  opacity: 0.3;
`;

export const SvgCloudPath = styled.path<{ $stage: DragonStageId }>`
  fill: ${({ $stage, theme }) => cloudFill($stage, theme.colors)};
`;

/* --- Ambient Particles: Sparkles for Stage 1 & 2 --- */

export const SparkleGroup = styled.div<{
  $top: number;
  $left: number;
  $scale: number;
  $delaySec: number;
}>`
  position: absolute;
  top: ${({ $top }) => `${$top}%`};
  left: ${({ $left }) => `${$left}%`};
  width: ${({ $scale }) => `calc(clamp(10px, 3.6vw, 24px) * ${$scale})`};
  aspect-ratio: 1;
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
  overflow: visible;
`;

export const SvgSparklePath = styled.path<{ $stage: DragonStageId }>`
  fill: ${({ $stage, theme }) => ($stage === 2 ? theme.colors.highlight : theme.colors.dragonBody)};
`;

/* --- Ambient Particles: Rising Embers for Stage 3 --- */

export const EmberGroup = styled.div<{
  $bottom: number;
  $left: number;
  $scale: number;
  $durationSec: number;
  $delaySec: number;
}>`
  position: absolute;
  bottom: ${({ $bottom }) => `${$bottom}%`};
  left: ${({ $left }) => `${$left}%`};
  width: ${({ $scale }) => `calc(clamp(5px, 1.8vw, 12px) * ${$scale})`};
  aspect-ratio: 1;
  animation: ${riseEmber} ${({ $durationSec }) => `${$durationSec}s`} ease-out infinite;
  animation-delay: ${({ $delaySec }) => `${$delaySec}s`};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0.4;
  }
`;

// A round dot with a glow made with box-shadow: it is not clipped by an SVG box.
export const EmberItem = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accent};
  box-shadow: 0 0 8px ${({ theme }) => theme.colors.highlight};
`;
