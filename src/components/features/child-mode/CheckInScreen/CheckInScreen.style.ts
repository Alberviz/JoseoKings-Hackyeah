import styled, { css, keyframes } from "styled-components";

const floatAnim = keyframes`
  0%, 100% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(-8px) scale(1.02);
  }
`;

const pulseGlow = keyframes`
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.08);
  }
`;

const bounceCheer = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-16px) scale(1.1);
  }
  50% {
    transform: translateY(0) scale(0.95);
  }
  70% {
    transform: translateY(-6px) scale(1.04);
  }
`;

export const GameStage = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  max-width: ${({ theme }) => theme.maxContentWidth};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: 0 10px 30px rgba(91, 63, 168, 0.08);
`;

export const GameStatusHeader = styled.header`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

export const MeterButton = styled.button<{ $isActive: boolean; $isFilled: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  background: ${({ theme, $isActive }) => ($isActive ? theme.colors.primarySoft : "transparent")};
  border: 2px solid ${({ theme, $isActive }) => ($isActive ? theme.colors.primary : "transparent")};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: ${({ theme }) => theme.spacing.xs};
  cursor: pointer;
  min-height: ${({ theme }) => theme.touchTarget};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primarySoft};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const MeterIcon = styled.span`
  display: inline-flex;
`;

export const MeterLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const MeterBarTrack = styled.div`
  width: 100%;
  height: 10px;
  background: ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.pill};
  overflow: hidden;
`;

export const MeterBarFill = styled.div<{ $percent: number; $color?: string }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  background: ${({ theme, $color }) => $color || theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.pill};
  transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
`;

export const PetRoom = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md} 0;
  position: relative;
  min-height: 180px;
`;

export const PetGlow = styled.div`
  position: absolute;
  width: 180px;
  height: 180px;
  background: radial-gradient(
    circle,
    ${({ theme }) => theme.colors.primarySoft} 0%,
    transparent 70%
  );
  border-radius: 50%;
  animation: ${pulseGlow} 3s ease-in-out infinite;
  z-index: 0;
`;

export const PetContainer = styled.div<{ $cheer?: boolean }>`
  position: relative;
  z-index: 1;
  cursor: pointer;
  user-select: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  animation: ${({ $cheer }) => ($cheer ? bounceCheer : floatAnim)} 2.5s ease-in-out infinite;
`;

export const PetAvatarFace = styled.div<{ $mood: "happy" | "calm" | "resting" }>`
  width: 120px;
  height: 110px;
  border-radius: 50% 50% 45% 45%;
  background: linear-gradient(145deg, #7b5ecc, #5b3fa8);
  border: 4px solid #4a3289;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 8px 16px rgba(91, 63, 168, 0.25);
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

export const PetEyesRow = styled.div`
  display: flex;
  gap: 28px;
  margin-top: 10px;
`;

export const PetEye = styled.div<{ $blink?: boolean }>`
  width: 16px;
  height: 18px;
  background: #ffffff;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  &::after {
    content: "";
    width: 9px;
    height: 10px;
    background: #1d1b22;
    border-radius: 50%;
    position: absolute;
    top: 3px;
    left: 4px;
  }
`;

export const PetCheeksRow = styled.div`
  display: flex;
  gap: 50px;
  position: absolute;
  top: 50px;
`;

export const PetCheek = styled.div`
  width: 14px;
  height: 8px;
  background: rgba(255, 182, 193, 0.7);
  border-radius: 50%;
`;

export const PetMouth = styled.div<{ $mood: "happy" | "calm" | "resting" }>`
  width: 20px;
  height: 10px;
  border-bottom: 3px solid #1d1b22;
  border-radius: 0 0 12px 12px;
  margin-top: 6px;

  ${({ $mood }) =>
    $mood === "happy" &&
    css`
      width: 24px;
      height: 14px;
      background: #ff708f;
      border: 2px solid #1d1b22;
      border-radius: 0 0 16px 16px;
    `}
`;

export const PetNameBadge = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.primarySoft};
  padding: 2px 10px;
  border-radius: ${({ theme }) => theme.radius.pill};
`;

export const SpeechBubble = styled.div`
  position: relative;
  background: ${({ theme }) => theme.colors.background};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.md};
  margin: ${({ theme }) => theme.spacing.sm} auto;
  width: 100%;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  &::before {
    content: "";
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 0 10px 10px;
    border-style: solid;
    border-color: ${({ theme }) => theme.colors.primary} transparent;
    display: block;
    width: 0;
  }
`;

export const SpeechText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize.lg};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.3;
`;

export const SpeechHint = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

export const ChoicesGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
`;

export const ChoiceGameButton = styled.button<{ $isSelected: boolean }>`
  min-height: ${({ theme }) => theme.touchTarget};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 2px solid
    ${({ theme, $isSelected }) => ($isSelected ? theme.colors.primary : theme.colors.border)};
  background: ${({ theme, $isSelected }) =>
    $isSelected ? theme.colors.primarySoft : theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.15s ease,
    border-color 0.2s ease,
    background 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme, $isSelected }) =>
      $isSelected ? theme.colors.primarySoft : theme.colors.background};
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const ChoiceIconBadge = styled.span`
  font-size: 1.85rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.radius.pill};
  flex-shrink: 0;
`;

export const ChoiceText = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.fontSize.md};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
`;

export const GameActions = styled.footer`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px dashed ${({ theme }) => theme.colors.border};
  width: 100%;
`;

export const NextStepRow = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const NavSpacer = styled.span`
  width: 1px;
`;

export const RestTodayButton = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  padding: ${({ theme }) => theme.spacing.sm};
  min-height: ${({ theme }) => theme.touchTarget};
  cursor: pointer;
  text-decoration: underline;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const EndCelebrationBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg} 0;
  width: 100%;
`;

export const StarsBadge = styled.div`
  font-size: 3.5rem;
  line-height: 1;
`;

export const ParentReportNotice = styled.aside`
  background: ${({ theme }) => theme.colors.primarySoft};
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: ${({ theme }) => theme.spacing.md};
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  width: 100%;
`;
