import styled, { keyframes } from "styled-components";

const chestFloat = keyframes`
  0%, 100% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(-6px) scale(1.02);
  }
`;

const sparkleGlow = keyframes`
  0%, 100% {
    opacity: 0.6;
    transform: scale(0.95);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
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

export const ChestSvg = styled.svg`
  width: 180px;
  height: 150px;
  overflow: visible;

  @media (prefers-reduced-motion: no-preference) {
    animation: ${chestFloat} 3s ease-in-out infinite;
  }
`;

export const ChestGlowPolygon = styled.polygon`
  fill: ${({ theme }) => theme.colors.highlight};
  opacity: 0.45;

  @media (prefers-reduced-motion: no-preference) {
    animation: ${sparkleGlow} 2s ease-in-out infinite;
  }
`;

export const ChestInside = styled.path`
  fill: ${({ theme }) => theme.colors.textMuted};
  stroke: ${({ theme }) => theme.colors.ink};
  stroke-width: ${({ theme }) => theme.borderWidth};
`;

export const ChestGoldGlowEllipse = styled.ellipse`
  fill: ${({ theme }) => theme.colors.highlight};
  stroke: ${({ theme }) => theme.colors.dragonHorn};
  stroke-width: 1.5px;
`;

export const ChestLidPath = styled.path`
  fill: ${({ theme }) => theme.colors.surface};
  stroke: ${({ theme }) => theme.colors.ink};
  stroke-width: ${({ theme }) => theme.borderWidth};
`;

export const ChestBodyPath = styled.path`
  fill: ${({ theme }) => theme.colors.surface};
  stroke: ${({ theme }) => theme.colors.ink};
  stroke-width: ${({ theme }) => theme.borderWidth};
`;

export const ChestBandPath = styled.path`
  stroke: ${({ theme }) => theme.colors.accent};
  stroke-width: 4px;
  fill: none;
`;

export const ChestClaspRect = styled.rect`
  fill: ${({ theme }) => theme.colors.highlight};
  stroke: ${({ theme }) => theme.colors.ink};
  stroke-width: 2px;
`;

export const ChestSparklePolygon = styled.polygon`
  fill: ${({ theme }) => theme.colors.highlight};
  stroke: ${({ theme }) => theme.colors.ink};
  stroke-width: 1px;

  @media (prefers-reduced-motion: no-preference) {
    animation: ${sparkleGlow} 2s ease-in-out infinite;
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
