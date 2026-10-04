import styled, { css, keyframes } from "styled-components";

const floatAnim = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-6px);
  }
`;

const bounceCheer = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-14px) scale(1.06);
  }
  50% {
    transform: translateY(0) scale(0.97);
  }
  70% {
    transform: translateY(-5px) scale(1.02);
  }
`;

const inkBorder = css`
  border: ${({ theme }) => `${theme.borderWidth} solid ${theme.colors.ink}`};
`;

export const CheckInContainer = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  max-width: ${({ theme }) => theme.maxContentWidth};
  margin: 0 auto;
  box-sizing: border-box;
`;

export const ProgressHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
`;

export const ProgressTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-height: ${({ theme }) => theme.touchTarget};
`;

export const TopRowSpacer = styled.span`
  display: inline-block;
  width: ${({ theme }) => theme.touchTarget};
  height: ${({ theme }) => theme.touchTarget};
`;

export const ProgressLabel = styled.span`
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.ink};
`;

export const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.ink};
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.md};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  min-height: ${({ theme }) => theme.touchTarget};
  min-width: ${({ theme }) => theme.touchTarget};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md} ${theme.spacing.xs} ${theme.spacing.sm}`};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radius.pill};

  &:hover {
    background: ${({ theme }) => theme.colors.primarySoft};
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const BackArrow = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xl};
  line-height: 1;
`;

export const PetRoom = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
`;

export const PetContainer = styled.div<{ $cheer?: boolean }>`
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};

  @media (prefers-reduced-motion: no-preference) {
    animation: ${({ $cheer }) => ($cheer ? bounceCheer : floatAnim)} 2.5s ease-in-out infinite;
  }
`;

export const PetNameBadge = styled.span`
  ${inkBorder}
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.ink};
  background: ${({ theme }) => theme.colors.surface};
  padding: 2px ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.pill};
  box-shadow: ${({ theme }) => `2px 3px 0 ${theme.colors.ink}`};
`;

export const SpeechBubble = styled.div`
  ${inkBorder}
  position: relative;
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  margin-left: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.leaf};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
  text-align: left;

  &::before,
  &::after {
    content: "";
    position: absolute;
    left: 50%;
    width: 0;
    height: 0;
    border-style: solid;
    border-color: transparent;
  }

  /* Ink triangle (outline) and surface triangle (fill) pointing left to the companion. */
  &::before {
    left: -16px;
    top: 50%;
    transform: translateY(-50%);
    border-width: 12px 14px 12px 0;
    border-right-color: ${({ theme }) => theme.colors.ink};
  }

  &::after {
    left: -11px;
    top: 50%;
    transform: translateY(-50%);
    border-width: 9px 11px 9px 0;
    border-right-color: ${({ theme }) => theme.colors.surface};
  }
`;

export const SpeechText = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.xl};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.ink};
  line-height: 1.2;
`;

export const SpeechHint = styled.span`
  display: block;
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-family: ${({ theme }) => theme.fontFamily.body};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const ChoicesGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.xs} ${theme.spacing.xs} 0`};
  box-sizing: border-box;
`;

export const ChoiceGameButton = styled.button<{ $isSelected: boolean }>`
  ${inkBorder}
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  min-height: 64px;
  box-sizing: border-box;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background: ${({ theme, $isSelected }) =>
    $isSelected ? theme.colors.primarySoft : theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
  color: ${({ theme }) => theme.colors.ink};
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.1s ease,
    box-shadow 0.1s ease,
    background-color 0.1s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 4px 6px 0 ${({ theme }) => theme.colors.ink};
  }

  &:active {
    transform: translate(2px, 3px);
    box-shadow: 1px 1px 0 ${({ theme }) => theme.colors.ink};
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover,
    &:active {
      transform: none;
    }
  }
`;

export const ChoiceIconBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  background: ${({ theme }) => theme.colors.paper};
  border: 2px solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.md};
`;

export const ChoiceText = styled.span`
  flex: 1;
  min-width: 0;
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.lg};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.ink};
  line-height: 1.2;
`;

export const ChoiceTickSlot = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
`;

export const SelectedChoiceNote = styled.p`
  margin: 0;
  text-align: center;
  font-family: ${({ theme }) => theme.fontFamily.body};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const GameActions = styled.footer`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 2px dashed ${({ theme }) => theme.colors.border};
`;

export const RestTodayButton = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fontFamily.body};
  font-size: ${({ theme }) => theme.fontSize.md};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  text-decoration: underline;
  min-height: ${({ theme }) => theme.touchTarget};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.sm};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const LoadingBox = styled.div`
  display: flex;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl} 0;
`;

export const EndCelebrationBox = styled.article`
  ${inkBorder}
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  box-sizing: border-box;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
`;

export const StarsBadge = styled.div`
  display: flex;
  justify-content: center;
  line-height: 0;
`;

export const ParentReportNotice = styled.aside`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  width: 100%;
  box-sizing: border-box;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primarySoft};
  border: 2px solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.leaf};
  text-align: left;
`;
