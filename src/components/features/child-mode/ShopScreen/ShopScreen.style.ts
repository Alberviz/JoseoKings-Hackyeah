import styled from "styled-components";

export const ShopRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
`;

export const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const CountersRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const StatPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: 6px ${({ theme }) => theme.spacing.md};
  min-height: ${({ theme }) => theme.touchTarget};
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.pill};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.ink};
  box-sizing: border-box;
`;

export const AddCoinsButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: 6px ${({ theme }) => theme.spacing.sm};
  min-height: ${({ theme }) => theme.touchTarget};
  background: ${({ theme }) => theme.colors.highlight};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.pill};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.ink};
  cursor: pointer;
  box-sizing: border-box;
  transition: transform 0.1s ease;

  &:hover {
    filter: brightness(1.05);
  }

  &:active {
    transform: translateY(2px);
    box-shadow: none;
  }
`;

export const MessageBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background: ${({ theme }) => theme.colors.primarySoft};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.leaf};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
  font-family: ${({ theme }) => theme.fontFamily.body};
  font-size: ${({ theme }) => theme.fontSize.md};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  color: ${({ theme }) => theme.colors.ink};
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const ItemsList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const ShopItemCard = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.leaf};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
`;

export const ItemLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const ItemIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  min-width: 52px;
  min-height: 52px;
  background: ${({ theme }) => theme.colors.paper};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.md};
`;

export const ItemInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const ItemNameText = styled.span`
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.md};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.ink};
`;

export const PriceTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const OwnedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: ${({ theme }) => theme.touchTarget};
  min-width: ${({ theme }) => theme.touchTarget};
  padding: 0 ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.mint};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.pill};
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.ink};
`;

export const RewardCard = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.leaf};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
`;

export const RewardInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const RewardNameText = styled.span`
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.md};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.ink};
`;

export const RewardFireCost = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const ClaimsSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.mint};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.leaf};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
`;

export const ClaimsList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const ClaimItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-family: ${({ theme }) => theme.fontFamily.body};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.ink};
`;

export const ClaimItemText = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

export const ClaimStatusText = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/* Styled SVG primitives and icons */
export const SvgIcon = styled.svg`
  width: 24px;
  height: 24px;
  display: block;
`;

export const SvgCoinIcon = styled.svg`
  width: 20px;
  height: 20px;
  display: block;
`;

export const SvgFireIcon = styled.svg`
  width: 20px;
  height: 20px;
  display: block;
`;

export const SvgItemIcon = styled.svg`
  width: 32px;
  height: 32px;
  display: block;
`;

export const SvgPath = styled.path``;
export const SvgCircle = styled.circle``;
export const SvgRect = styled.rect``;
export const SvgEllipse = styled.ellipse``;
export const SvgPolygon = styled.polygon``;
export const SvgG = styled.g``;
