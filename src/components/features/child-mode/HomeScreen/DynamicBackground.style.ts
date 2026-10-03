import styled, { css, keyframes } from "styled-components";

const floatCloud = keyframes`
  0% {
    transform: translate3d(-180px, 0, 0);
  }
  100% {
    transform: translate3d(calc(100vw + 180px), 0, 0);
  }
`;

const pulseSparkle = keyframes`
  0%, 100% {
    opacity: 0.15;
    transform: scale(0.85);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.15);
  }
`;

const riseEmber = keyframes`
  0% {
    transform: translate3d(0, 100vh, 0) scale(0.6);
    opacity: 0;
  }
  20% {
    opacity: 0.8;
  }
  80% {
    opacity: 0.6;
  }
  100% {
    transform: translate3d(30px, -40px, 0) scale(1.2);
    opacity: 0;
  }
`;

const auroraWave = keyframes`
  0% {
    transform: scaleY(1) translateY(0);
    opacity: 0.35;
  }
  50% {
    transform: scaleY(1.25) translateY(12px);
    opacity: 0.65;
  }
  100% {
    transform: scaleY(0.95) translateY(-8px);
    opacity: 0.4;
  }
`;

export const BackgroundContainer = styled.div<{ $stage: 1 | 2 | 3 }>`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
  transition: background 600ms ease;

  ${({ $stage }) =>
    $stage === 3
      ? css`
          background: linear-gradient(180deg, #1b1e38 0%, #272145 35%, #332140 70%, #191b2c 100%);
        `
      : $stage === 2
        ? css`
            background: linear-gradient(180deg, #fdeddb 0%, #f8ded2 40%, #fbf3eb 80%, #f4ece2 100%);
          `
        : css`
            background: linear-gradient(180deg, #e8f4f8 0%, #eff7f4 45%, #fcfaf6 85%, #f5efe6 100%);
          `}
`;

export const AuroraLayer = styled.div`
  position: absolute;
  top: 0;
  left: -20%;
  width: 140%;
  height: 48%;
  background:
    radial-gradient(ellipse 65% 55% at 30% 0%, rgba(54, 197, 212, 0.4) 0%, transparent 70%),
    radial-gradient(ellipse 70% 50% at 75% 10%, rgba(198, 181, 232, 0.35) 0%, transparent 70%),
    radial-gradient(ellipse 50% 40% at 50% 25%, rgba(255, 122, 89, 0.22) 0%, transparent 70%);
  animation: ${auroraWave} 10s ease-in-out infinite alternate;
  filter: blur(28px);
  pointer-events: none;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const CloudGroup = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

export const CloudItem = styled.div<{
  $topPercent: number;
  $scale: number;
  $durationSec: number;
  $delaySec: number;
  $opacity: number;
}>`
  position: absolute;
  top: ${({ $topPercent }) => $topPercent}%;
  left: 0;
  transform: translate3d(-180px, 0, 0);
  opacity: ${({ $opacity }) => $opacity};
  animation: ${floatCloud} ${({ $durationSec }) => $durationSec}s linear infinite;
  animation-delay: ${({ $delaySec }) => $delaySec}s;
  pointer-events: none;
  will-change: transform;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transform: none;
    left: ${({ $topPercent }) => ($topPercent * 1.3) % 80}%;
  }
`;

export const CloudSvg = styled.svg<{ $stage: 1 | 2 | 3; $width: number }>`
  width: ${({ $width }) => $width}px;
  height: auto;
  display: block;
  filter: drop-shadow(
    0 4px 12px
      ${({ $stage }) =>
        $stage === 3
          ? "rgba(10, 8, 20, 0.45)"
          : $stage === 2
            ? "rgba(229, 168, 37, 0.12)"
            : "rgba(18, 119, 130, 0.08)"}
  );
`;

export const SvgCloudPath = styled.path<{ $stage: 1 | 2 | 3 }>`
  fill: ${({ $stage }) =>
    $stage === 3
      ? "rgba(48, 42, 78, 0.65)"
      : $stage === 2
        ? "rgba(255, 246, 238, 0.88)"
        : "rgba(255, 255, 255, 0.92)"};
`;

export const SparkleGroup = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

export const SparkleItem = styled.div<{
  $top: number;
  $left: number;
  $size: number;
  $duration: number;
  $delay: number;
  $color: string;
}>`
  position: absolute;
  top: ${({ $top }) => $top}%;
  left: ${({ $left }) => $left}%;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  box-shadow: 0 0 8px ${({ $color }) => $color};
  animation: ${pulseSparkle} ${({ $duration }) => $duration}s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay}s;
  pointer-events: none;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0.4;
  }
`;

export const EmberGroup = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

export const EmberItem = styled.div<{
  $left: number;
  $size: number;
  $duration: number;
  $delay: number;
}>`
  position: absolute;
  bottom: 0;
  left: ${({ $left }) => $left}%;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background: #ff7a59;
  box-shadow:
    0 0 6px #ff7a59,
    0 0 12px #ffe27a;
  animation: ${riseEmber} ${({ $duration }) => $duration}s ease-out infinite;
  animation-delay: ${({ $delay }) => $delay}s;
  pointer-events: none;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    display: none;
  }
`;
