import styled, { css, keyframes } from "styled-components";

const chestFloat = keyframes`
  0%, 100% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(-6px) scale(1.02);
  }
`;

const chestClosedWiggle = keyframes`
  0%, 65%, 100% {
    transform: translateY(0) rotate(0deg) scale(1);
  }
  70% {
    transform: translateY(-6px) rotate(-4deg) scale(1.04);
  }
  75% {
    transform: translateY(-7px) rotate(4deg) scale(1.04);
  }
  80% {
    transform: translateY(-4px) rotate(-3deg) scale(1.02);
  }
  85% {
    transform: translateY(-2px) rotate(2deg) scale(1.01);
  }
  90% {
    transform: translateY(0) rotate(0deg) scale(1);
  }
`;

const chestOpenBurst = keyframes`
  0% {
    transform: scale(0.7) translateY(20px);
    opacity: 0.8;
  }
  45% {
    transform: scale(1.15) translateY(-12px);
    opacity: 1;
  }
  70% {
    transform: scale(0.95) translateY(2px);
  }
  85% {
    transform: scale(1.04) translateY(-1px);
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
`;

const tapBounceReaction = keyframes`
  0% { transform: scale(1) translateY(0); }
  25% { transform: scale(1.14, 0.88) translateY(4px); }
  55% { transform: scale(0.88, 1.14) translateY(-14px); }
  75% { transform: scale(1.05, 0.96) translateY(2px); }
  100% { transform: scale(1) translateY(0); }
`;

const goldRaysSpin = keyframes`
  0% {
    transform: rotate(0deg) scale(0.95);
    opacity: 0.5;
  }
  50% {
    transform: rotate(180deg) scale(1.12);
    opacity: 0.85;
  }
  100% {
    transform: rotate(360deg) scale(0.95);
    opacity: 0.5;
  }
`;

const sparklePop = keyframes`
  0%, 100% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
  75% {
    opacity: 0.85;
    transform: scale(0.95);
  }
`;

const coinBadgePop = keyframes`
  0% {
    transform: scale(0.4) translateY(20px);
    opacity: 0;
  }
  65% {
    transform: scale(1.12) translateY(-4px);
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
`;

export const PlayContainer = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  max-width: ${({ theme }) => theme.maxContentWidth};
  margin: 0 auto;
  box-sizing: border-box;
  padding: ${({ theme }) => theme.spacing.md};
`;

export const PlayTopBar = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  min-height: ${({ theme }) => theme.touchTarget};
`;

export const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fontFamily.body};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  min-height: ${({ theme }) => theme.touchTarget};
  min-width: ${({ theme }) => theme.touchTarget};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radius.sm};

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const StepIndicator = styled.span`
  font-family: ${({ theme }) => theme.fontFamily.body};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const PlayStage = styled.article`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
`;

export const CompanionBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs} 0;
`;

export const PlayHeadingBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: ${({ theme }) => theme.spacing.xs};
  width: 100%;
`;

export const ChoiceGrid = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: ${({ $columns = 1 }) => `repeat(${$columns}, 1fr)`};
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

export const ChoiceButton = styled.button<{ $selected?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  min-height: 64px;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.primarySoft : theme.colors.surface};
  border: ${({ theme }) => `${theme.borderWidth} solid ${theme.colors.ink}`};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
  cursor: pointer;
  text-align: center;
  transition:
    transform 0.1s ease,
    box-shadow 0.1s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 4px 6px 0 ${({ theme }) => theme.colors.ink};
  }

  &:active {
    transform: translateY(2px);
    box-shadow: 1px 1px 0 ${({ theme }) => theme.colors.ink};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover,
    &:active {
      transform: none;
    }
  }
`;

export const ChoiceTitle = styled.span`
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.lg};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.ink};
  line-height: 1.2;
`;

export const ChoiceSubtitle = styled.span`
  font-family: ${({ theme }) => theme.fontFamily.body};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.3;
`;

export const DotsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

export const ChoiceDot = styled.span<{ $active?: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.border)};
  border: 1.5px solid ${({ theme }) => theme.colors.ink};
  display: inline-block;
`;

export const GameCard = styled.article`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => `${theme.borderWidth} solid ${theme.colors.ink}`};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
  box-sizing: border-box;
`;

export const GameBadgeRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
  justify-content: center;
`;

export const GameActionsRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
`;

export const ExerciseBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  text-align: center;
`;

export const ExerciseFigureBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 220px;
`;

export const ExerciseStepTextBox = styled.div`
  text-align: center;
  padding: 0 ${({ theme }) => theme.spacing.sm};
  max-width: 480px;
  width: 100%;
`;

export const ExerciseTimerBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm} 0;
`;

export const ExerciseActionsRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
`;

export const RestNowButton = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fontFamily.body};
  font-size: ${({ theme }) => theme.fontSize.md};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  text-decoration: underline;
  min-height: ${({ theme }) => theme.touchTarget};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.sm};

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const ConfirmationWrapper = styled.div`
  width: 100%;
`;

export const ChestContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
`;

export const ChestWrapper = styled.button<{ $isOpen?: boolean; $isTapped?: boolean }>`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 250px;
  height: 230px;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 6px;
    border-radius: ${({ theme }) => theme.radius.lg};
  }

  @media (prefers-reduced-motion: no-preference) {
    ${({ $isOpen, $isTapped }) =>
      !$isOpen
        ? css`
            animation: ${chestClosedWiggle} 3.6s ease-in-out infinite;
          `
        : $isTapped
          ? css`
              animation: ${tapBounceReaction} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
            `
          : css`
              animation: ${chestFloat} 3.2s ease-in-out infinite;
            `}
  }
`;

export const ChestGlowAura = styled.div<{ $isOpen?: boolean }>`
  position: absolute;
  width: ${({ $isOpen }) => ($isOpen ? "230px" : "190px")};
  height: ${({ $isOpen }) => ($isOpen ? "230px" : "190px")};
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 201, 60, ${({ $isOpen }) => ($isOpen ? 0.75 : 0.4)}) 0%,
    rgba(255, 122, 89, ${({ $isOpen }) => ($isOpen ? 0.35 : 0.1)}) 45%,
    transparent 70%
  );
  filter: blur(14px);
  z-index: 0;
  transition:
    width 0.4s ease,
    height 0.4s ease;

  @media (prefers-reduced-motion: no-preference) {
    animation: ${goldRaysSpin} ${({ $isOpen }) => ($isOpen ? "7s" : "12s")} linear infinite;
  }
`;

export const ChestRasterImg = styled.img<{ $isOpen?: boolean; $isTapped?: boolean }>`
  position: relative;
  width: 230px;
  height: 230px;
  object-fit: contain;
  filter: drop-shadow(0 12px 20px rgba(31, 47, 107, 0.16));
  z-index: 1;

  @media (prefers-reduced-motion: no-preference) {
    ${({ $isOpen }) =>
      $isOpen
        ? css`
            animation: ${chestOpenBurst} 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          `
        : css`
            animation: ${chestFloat} 3.2s ease-in-out infinite;
          `}
  }
`;

export const ChestSparklesOverlay = styled.svg`
  position: absolute;
  width: 250px;
  height: 230px;
  pointer-events: none;
  z-index: 2;
  overflow: visible;
`;

export const SparkleStar = styled.path<{ $delay: number }>`
  fill: ${({ theme }) => theme.colors.highlight};
  stroke: ${({ theme }) => theme.colors.ink};
  stroke-width: 1.5px;
  transform-box: fill-box;
  transform-origin: center;

  @media (prefers-reduced-motion: no-preference) {
    animation: ${sparklePop} 1.4s ${({ $delay }) => $delay}s cubic-bezier(0.34, 1.56, 0.64, 1)
      infinite;
  }
`;

export const CoinBadge = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => `${theme.borderWidth} solid ${theme.colors.ink}`};
  border-radius: ${({ theme }) => theme.radius.pill};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};

  @media (prefers-reduced-motion: no-preference) {
    animation: ${coinBadgePop} 0.65s 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
`;

export const CoinRewardAmount = styled.span`
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.xxl};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.ink};
  line-height: 1;
`;

export const CoinSvg = styled.svg`
  width: 32px;
  height: 32px;
`;

export const CoinCircle = styled.circle`
  fill: ${({ theme }) => theme.colors.highlight};
  stroke: ${({ theme }) => theme.colors.ink};
  stroke-width: 2px;
`;

export const CoinInnerCircle = styled.circle`
  fill: none;
  stroke: ${({ theme }) => theme.colors.dragonHorn};
  stroke-width: 1.5px;
`;

export const CoinLetter = styled.text`
  fill: ${({ theme }) => theme.colors.ink};
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  text-anchor: middle;
  dominant-baseline: central;
`;

export const ChestSubline = styled.p`
  font-family: ${({ theme }) => theme.fontFamily.body};
  font-size: ${({ theme }) => theme.fontSize.md};
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  margin: 0;
`;
