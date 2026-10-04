import styled, { css, keyframes } from "styled-components";
import type { CompanionSize } from "./Companion";

const sizeMap: Record<CompanionSize, string> = {
  sm: "96px",
  md: "160px",
  lg: "240px",
  // Takes the full width of its parent, so the parent decides the size (fluid layouts).
  fill: "100%",
};

// =============================================================================
// Organic Keyframe Animations (Disney Principles: Squash & Stretch, Secondary Motion)
// =============================================================================

// --- 1. Idle Torso: Organic Breathing with Squash & Stretch ---
const idleBodyBreathe = keyframes`
  0%, 100% {
    transform: translateY(0px) scale(1, 1);
  }
  38% {
    /* Inhale: chest lifts and subtly elongates */
    transform: translateY(-3.5px) scale(0.99, 1.02);
  }
  50% {
    /* Peak breath: expansive chest */
    transform: translateY(-4.5px) scale(1.02, 1.025);
  }
  75% {
    /* Exhale: settling down */
    transform: translateY(-1.5px) scale(1.005, 1.005);
  }
  90% {
    /* Soft elastic settle at bottom */
    transform: translateY(0.5px) scale(1.01, 0.995);
  }
`;

// --- 2. Mint Belly: Forward Expansion with Lung Volume ---
const idleBellyBreathe = keyframes`
  0%, 100% {
    transform: scale(1, 1);
  }
  48% {
    /* Belly pushes forward and slightly up */
    transform: scale(1.045, 1.03) translateY(-1px);
  }
  90% {
    transform: scale(0.99, 0.995) translateY(0.5px);
  }
`;

// --- 3. Expressive Double-Blink with Organic Timing ---
const idleBlink = keyframes`
  0%, 82%, 88%, 94%, 100% {
    transform: scaleY(1);
  }
  85% {
    /* First fast blink */
    transform: scaleY(0.06);
  }
  91% {
    /* Second inquisitive micro-blink */
    transform: scaleY(0.08);
  }
`;

// --- 4. Wings: Organic Articulated Flapping with Secondary Lag ---
const leftWingIdle = keyframes`
  0%, 100% {
    transform: rotate(0deg) scale(1);
  }
  25% {
    transform: rotate(2deg) scale(0.98);
  }
  55% {
    /* Unfurls gently as air fills the lungs */
    transform: rotate(-9deg) scale(1.03);
  }
  80% {
    transform: rotate(-3deg) scale(1.01);
  }
`;

const rightWingIdle = keyframes`
  0%, 100% {
    transform: rotate(0deg) scale(1);
  }
  25% {
    transform: rotate(-2deg) scale(0.98);
  }
  55% {
    /* Symmetrical gentle unfurl */
    transform: rotate(9deg) scale(1.03);
  }
  80% {
    transform: rotate(3deg) scale(1.01);
  }
`;

// --- 5. Tail: Serpentine Wave with Follow-Through ---
const tailSwing = keyframes`
  0%, 100% {
    transform: rotate(0deg) translateY(0);
  }
  25% {
    transform: rotate(7.5deg) translateY(-1px);
  }
  50% {
    transform: rotate(-2deg) translateY(0.5px);
  }
  75% {
    transform: rotate(9.5deg) translateY(-1.5px);
  }
`;

// --- 6. Head: Curious Ladeos & Gentle Nods ---
const headTilt = keyframes`
  0%, 100% {
    transform: rotate(0deg) translateY(0);
  }
  20% {
    /* Curious tilt to the left */
    transform: rotate(-2.8deg) translateY(-0.8px);
  }
  45% {
    transform: rotate(0deg) translateY(-1.5px);
  }
  65% {
    /* Inquisitive tilt to the right */
    transform: rotate(3deg) translateY(-1.2px);
  }
  85% {
    transform: rotate(0.8deg) translateY(0);
  }
`;

// --- 7. Ear Fins: Micro-Twitching (Like real creatures listening) ---
const earFinLeft = keyframes`
  0%, 72%, 100% {
    transform: rotate(0deg);
  }
  75% {
    transform: rotate(-9deg);
  }
  79% {
    transform: rotate(3deg);
  }
  83% {
    transform: rotate(-7deg);
  }
  88% {
    transform: rotate(0deg);
  }
`;

const earFinRight = keyframes`
  0%, 72%, 100% {
    transform: rotate(0deg);
  }
  75% {
    transform: rotate(9deg);
  }
  79% {
    transform: rotate(-3deg);
  }
  83% {
    transform: rotate(7deg);
  }
  88% {
    transform: rotate(0deg);
  }
`;

// --- 8. Resting Paws: Riding the Respiratory Wave ---
const restingArmsIdle = keyframes`
  0%, 100% {
    transform: translateY(0px) scale(1);
  }
  48% {
    transform: translateY(-2.2px) scale(1.02);
  }
`;

// =============================================================================
// Pose-Specific Keyframes
// =============================================================================

// --- Cheer: Squat Anticipation, High Leap, and Joyous Landing ---
const cheerSquatStretch = keyframes`
  0% {
    transform: scale(1, 1) translateY(0);
  }
  15% {
    /* Anticipation squat */
    transform: scale(1.08, 0.88) translateY(5px);
  }
  45% {
    /* Explosive upward leap */
    transform: scale(0.92, 1.12) translateY(-18px);
  }
  65% {
    /* Peak floating cheer */
    transform: scale(1.02, 0.98) translateY(-12px);
  }
  82% {
    /* Landing bounce */
    transform: scale(1.05, 0.95) translateY(2px);
  }
  100% {
    transform: scale(1, 1) translateY(0);
  }
`;

const leftWingCheer = keyframes`
  0% { transform: rotate(0deg); }
  15% { transform: rotate(5deg); }
  45% { transform: rotate(-32deg) scale(1.06); }
  75% { transform: rotate(-24deg); }
  100% { transform: rotate(-26deg); }
`;

const rightWingCheer = keyframes`
  0% { transform: rotate(0deg); }
  15% { transform: rotate(-5deg); }
  45% { transform: rotate(32deg) scale(1.06); }
  75% { transform: rotate(24deg); }
  100% { transform: rotate(26deg); }
`;

const cheerArmsWave = keyframes`
  0%, 100% {
    transform: rotate(-12deg);
  }
  50% {
    transform: rotate(12deg);
  }
`;

// --- Exercise Mission Poses ---
const breatheScale = keyframes`
  0%, 100% {
    transform: scale(1) translateY(0);
  }
  50% {
    transform: scale(1.08) translateY(-4px);
  }
`;

const stretchSway = keyframes`
  0%, 100% {
    transform: rotate(-7deg) scale(1.01);
  }
  50% {
    transform: rotate(7deg) scale(1.01);
  }
`;

const balanceSway = keyframes`
  0%, 100% {
    transform: rotate(-4deg) translateX(-1px);
  }
  50% {
    transform: rotate(4deg) translateX(1px);
  }
`;

const strengthPulse = keyframes`
  0%, 100% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(5px) scale(1.02, 0.97);
  }
`;

// --- Keyframes for Eating and Flame Puff ---

const eatMunchSquash = keyframes`
  0% {
    transform: translateY(0) scale(1, 1);
  }
  15% {
    transform: translateY(3px) scale(1.03, 0.96);
  }
  30% {
    transform: translateY(-2px) scale(0.98, 1.02);
  }
  45% {
    transform: translateY(2px) scale(1.02, 0.98);
  }
  60% {
    transform: translateY(-6px) scale(0.96, 1.05);
  }
  75% {
    transform: translateY(-4px) scale(1.03, 0.98);
  }
  100% {
    transform: translateY(0) scale(1, 1);
  }
`;

const flamePuffGrow = keyframes`
  0%, 42% {
    transform: scale(0) translateY(0);
    opacity: 0;
  }
  55% {
    transform: scale(0.7) translateY(-4px);
    opacity: 0.95;
  }
  72% {
    transform: scale(1.25) translateY(-14px);
    opacity: 1;
  }
  88% {
    transform: scale(1) translateY(-22px);
    opacity: 0.85;
  }
  100% {
    transform: scale(0.3) translateY(-32px);
    opacity: 0;
  }
`;

const emberSparkle = keyframes`
  0%, 45% {
    transform: scale(0) translate(0, 0);
    opacity: 0;
  }
  62% {
    transform: scale(1.4) translate(var(--dx, 8px), -12px);
    opacity: 1;
  }
  85% {
    transform: scale(0.9) translate(var(--dx2, 14px), -24px);
    opacity: 0.8;
  }
  100% {
    transform: scale(0) translate(var(--dx3, 20px), -36px);
    opacity: 0;
  }
`;

const tapBounce = keyframes`
  0% {
    transform: scale(1, 1);
  }
  30% {
    transform: scale(1.08, 0.92) translateY(3px);
  }
  60% {
    transform: scale(0.94, 1.06) translateY(-8px);
  }
  85% {
    transform: scale(1.02, 0.98) translateY(1px);
  }
  100% {
    transform: scale(1, 1) translateY(0);
  }
`;

// =============================================================================
// Styled SVG Primitives & Container
// =============================================================================

export const StyledCompanionSvg = styled.svg<{
  $size: CompanionSize;
  $animated?: boolean;
  $interactive?: boolean;
  $tapped?: boolean;
}>`
  display: block;
  flex-shrink: 0;
  width: ${({ $size }) => sizeMap[$size]};
  height: auto;
  aspect-ratio: 1 / 1;
  max-width: 100%;
  overflow: visible;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  ${({ $interactive }) =>
    $interactive &&
    css`
      cursor: pointer;
      transition:
        filter 0.25s ease,
        transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

      &:hover {
        filter: drop-shadow(0 4px 12px rgba(54, 197, 212, 0.35));
        transform: scale(1.02);
      }

      &:active {
        transform: scale(0.97) translateY(2px);
      }
    `}

  ${({ $tapped }) =>
    $tapped &&
    css`
      animation: ${tapBounce} 0.6s ease-in-out;
    `}

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
export const SvgImage = styled.image<{ $isTeal?: boolean }>`
  ${({ $isTeal }) =>
    $isTeal &&
    css`
      filter: hue-rotate(40deg) saturate(1.1);
    `}
`;

export const HiddenSemanticG = styled.g`
  opacity: 0.001;
  pointer-events: none;
`;

// --- 9. Flame Breath Puff (When feeding in /food) ---
const flameBreathPuff = keyframes`
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0.2) rotate(-6deg);
  }
  20% {
    opacity: 1;
    transform: translate(6px, -6px) scale(0.9) rotate(0deg);
  }
  55% {
    opacity: 1;
    transform: translate(18px, -18px) scale(1.25) rotate(6deg);
  }
  80% {
    opacity: 0.9;
    transform: translate(32px, -32px) scale(1.1) rotate(10deg);
  }
  100% {
    opacity: 0;
    transform: translate(45px, -45px) scale(0.6) rotate(14deg);
  }
`;

// --- 10. Embers & Sparkles (Celebrations and rewards) ---
const emberSparkleFloat = keyframes`
  0% {
    opacity: 0;
    transform: translateY(0) scale(0.4);
  }
  30% {
    opacity: 1;
    transform: translateY(-12px) scale(1.1);
  }
  70% {
    opacity: 0.85;
    transform: translateY(-28px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-44px) scale(0.3);
  }
`;

// --- 11. Tap Interaction Bounce ---
const tapBounceReaction = keyframes`
  0% { transform: scale(1, 1) translateY(0); }
  20% { transform: scale(1.12, 0.88) translateY(4px); }
  50% { transform: scale(0.92, 1.14) translateY(-18px); }
  75% { transform: scale(1.04, 0.96) translateY(2px); }
  100% { transform: scale(1, 1) translateY(0); }
`;

export const AnimatedIdleG = styled.g<{ $animated?: boolean; $isTapped?: boolean }>`
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: ${({ $isTapped }) =>
    $isTapped
      ? css`
          ${tapBounceReaction} 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)
        `
      : css`
          ${idleBodyBreathe} 3.6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite
        `};

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedBellyG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: ${idleBellyBreathe} 3.6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;

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
          ${leftWingCheer} 0.95s cubic-bezier(0.34, 1.56, 0.64, 1) forwards
        `
      : css`
          ${leftWingIdle} 3.6s ease-in-out 120ms infinite
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
          ${rightWingCheer} 0.95s cubic-bezier(0.34, 1.56, 0.64, 1) forwards
        `
      : css`
          ${rightWingIdle} 3.6s ease-in-out 120ms infinite
        `};

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedTailG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 5% 85%;
  animation: ${tailSwing} 3.8s ease-in-out 220ms infinite;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedHeadG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 50% 90%;
  animation: ${headTilt} 4.6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedLeftEarFinG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 85% 65%;
  animation: ${earFinLeft} 5.5s ease-in-out infinite;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedRightEarFinG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 15% 65%;
  animation: ${earFinRight} 5.5s ease-in-out infinite;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedEyesG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 50% 50%;
  animation: ${idleBlink} 4.8s ease-in-out infinite;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedRestingArmsG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 50% 30%;
  animation: ${restingArmsIdle} 3.6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedCheerG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: ${cheerSquatStretch} 0.95s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedCheerArmsG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 50% 70%;
  animation: ${cheerArmsWave} 0.75s ease-in-out infinite;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedBreatheG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 50% 60%;
  animation: ${breatheScale} 4.5s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;

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

export const AnimatedEatG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: ${eatMunchSquash} 1.8s ease-in-out forwards;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedFlamePuffG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 10% 90%;
  animation: ${flameBreathPuff} 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedFlameG = styled.g<{ $animated?: boolean }>`
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: ${flamePuffGrow} 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedEmberCircle = styled.circle<{
  $dx?: string;
  $dx2?: string;
  $dx3?: string;
  $animated?: boolean;
}>`
  --dx: ${({ $dx }) => $dx || "8px"};
  --dx2: ${({ $dx2 }) => $dx2 || "14px"};
  --dx3: ${({ $dx3 }) => $dx3 || "20px"};
  animation: ${emberSparkle} 1.8s ease-out forwards;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const AnimatedEmbersG = styled.g<{ $animated?: boolean }>`
  animation: ${emberSparkleFloat} 1.5s ease-out infinite;

  ${({ $animated }) => $animated === false && `animation: none !important;`}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;
