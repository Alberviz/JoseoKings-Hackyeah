import Link from "next/link";
import styled from "styled-components";

export const HomeScreenRoot = styled.main`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0;
  padding: env(safe-area-inset-top, 16px) 16px env(safe-area-inset-bottom, 16px) 16px;
  background-color: ${({ theme }) => theme.colors.childHomeBg};
  overflow-x: hidden;
  box-sizing: border-box;
  user-select: none;
  position: relative;
`;

export const TopBar = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 440px;
  min-height: 48px;
  gap: ${({ theme }) => theme.spacing.xs};
  box-sizing: border-box;
  position: relative;
  z-index: 1;
`;

export const FireBar = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: 6px 10px;
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.sm};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
  min-height: 40px;
  box-sizing: border-box;
`;

export const FlameIconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: ${({ theme }) => theme.colors.accent};
  flex-shrink: 0;
`;

export const FireTrack = styled.div`
  width: 48px;
  height: 12px;
  background: ${({ theme }) => theme.colors.paper};
  border: 1.5px solid ${({ theme }) => theme.colors.ink};
  border-radius: 3px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
`;

export const FireFill = styled.div.attrs<{ $percent: number }>(({ $percent }) => ({
  style: { width: `${$percent}%` },
}))`
  height: 100%;
  background: ${({ theme }) => theme.colors.accent};
  transition: width 300ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const FireValue = styled.span`
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.ink};
  line-height: 1;
  margin-left: 2px;
`;

export const TopRightCluster = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-shrink: 0;
`;

export const CoinsPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: 6px 12px;
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.pill};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
  min-height: 40px;
  box-sizing: border-box;
  cursor: pointer;
  transition: transform 0.1s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.highlight};
  }

  &:active {
    transform: translateY(2px);
    box-shadow: none;
  }
`;

export const CoinIconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: ${({ theme }) => theme.colors.highlight};
  flex-shrink: 0;
`;

export const CoinsValue = styled.span`
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.ink};
  line-height: 1;
`;

export const ParentDoorLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 10px;
  min-height: ${({ theme }) => theme.touchTarget};
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
  border-radius: ${({ theme }) => theme.radius.pill};
  color: ${({ theme }) => theme.colors.textMuted};
  text-decoration: none;
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    background-color 120ms ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.text};
  }

  &:active {
    transform: translate(2px, 3px);
    box-shadow: none;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const ParentIconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
`;

export const ParentLabel = styled.span`
  line-height: 1;
`;

export const SmallParentLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  margin-top: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSize.sm};
  text-decoration: underline;
  min-height: ${({ theme }) => theme.touchTarget};

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const DragonStage = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  max-width: 440px;
  flex: 1;
  margin: ${({ theme }) => theme.spacing.xs} 0;
  position: relative;
  z-index: 1;
`;

export const StageBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(8px);
  border: 1.5px solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.pill};
  box-shadow: 0 4px 12px rgba(18, 119, 130, 0.12);
  user-select: none;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  z-index: 2;
`;

export const StageBadgeIcon = styled.span`
  font-size: 15px;
  line-height: 1;
`;

export const StageBadgeText = styled.span`
  display: flex;
  flex-direction: column;
  line-height: 1.15;
`;

export const StageTitleText = styled.span`
  font-size: 11px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.ink};
  font-family: ${({ theme }) => theme.fontFamily.heading};
  letter-spacing: 0.02em;
  text-transform: uppercase;
`;

export const StageNextText = styled.span`
  font-size: 9.5px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const DragonWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 14px 28px rgba(18, 119, 130, 0.22));
`;

export const BottomArea = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 380px;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: auto;
  margin-bottom: 4px;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
`;

export const CheckInBanner = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px;
  min-height: ${({ theme }) => theme.touchTarget};
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
  border-radius: ${({ theme }) => theme.radius.leaf};
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    background-color 120ms ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primarySoft};
  }

  &:active {
    transform: translate(2px, 3px);
    box-shadow: none;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const CheckInLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const CheckInIconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: ${({ theme }) => theme.colors.primary};
`;

export const CheckInTextGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
`;

export const CheckInTitle = styled.span`
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.ink};
  line-height: 1.2;
`;

export const CheckInSubtitle = styled.span`
  font-family: ${({ theme }) => theme.fontFamily.body};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.2;
`;

export const CheckInArrowWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: ${({ theme }) => theme.colors.ink};
`;

export const PlayButtonContainer = styled.div`
  width: 100%;
  box-sizing: border-box;

  & > button {
    min-height: 56px;
    font-size: ${({ theme }) => theme.fontSize.lg};
  }
`;

export const PlayContent = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
`;

export const PlayLabel = styled.span`
  letter-spacing: 0.05em;
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

export const ActionsNav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  box-sizing: border-box;
`;

export const ActionButtonWrapper = styled.div`
  flex: 1;
  min-width: 0;
  box-sizing: border-box;

  & > button {
    min-height: ${({ theme }) => theme.touchTarget};
    padding: 8px 4px;
  }
`;

export const ActionBtnContent = styled.span`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 100%;
`;

export const ActionIconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: ${({ theme }) => theme.colors.ink};
`;

export const ActionBtnLabel = styled.span`
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: 12px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  line-height: 1;
  color: ${({ theme }) => theme.colors.ink};
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.childHomeBg};
`;

/* Styled SVG and SVG geometry primitives */
export const FlameSvg = styled.svg`
  width: 20px;
  height: 20px;
  display: block;
`;

export const CoinSvg = styled.svg`
  width: 20px;
  height: 20px;
  display: block;
`;

export const NavSvg = styled.svg`
  width: 16px;
  height: 16px;
  display: block;
`;

export const PlayTriangleSvg = styled.svg`
  width: 22px;
  height: 22px;
  display: block;
`;

export const ShopSvg = styled.svg`
  width: 20px;
  height: 20px;
  display: block;
`;

export const FoodSvg = styled.svg`
  width: 20px;
  height: 20px;
  display: block;
`;

export const CustomizeSvg = styled.svg`
  width: 20px;
  height: 20px;
  display: block;
`;

export const CheckSvg = styled.svg`
  width: 24px;
  height: 24px;
  display: block;
`;

export const ArrowSvg = styled.svg`
  width: 18px;
  height: 18px;
  display: block;
`;

export const SvgPolygon = styled.polygon``;
export const SvgPath = styled.path``;
export const SvgCircle = styled.circle``;
export const SvgRect = styled.rect``;
