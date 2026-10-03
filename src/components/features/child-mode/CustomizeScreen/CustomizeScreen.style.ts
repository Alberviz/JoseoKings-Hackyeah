import styled from "styled-components";

export const CustomizeRoot = styled.div`
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
`;

export const Stage = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.sm} 0;
`;

export const WardrobeSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
`;

export const WearablesRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
`;

export const WearableItemWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const WearableSquareButton = styled.button<{ $isEquipped?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  min-width: ${({ theme }) => theme.touchTarget};
  min-height: ${({ theme }) => theme.touchTarget};
  background: ${({ theme, $isEquipped }) =>
    $isEquipped ? theme.colors.primarySoft : theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
  cursor: pointer;
  padding: 0;
  box-sizing: border-box;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    background-color 120ms ease;

  &:hover {
    background: ${({ theme, $isEquipped }) =>
      $isEquipped ? theme.colors.primarySoft : theme.colors.mint};
  }

  &:active {
    transform: translate(2px, 3px);
    box-shadow: none;
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const TickBadge = styled.span`
  position: absolute;
  top: -6px;
  right: -6px;
  width: 22px;
  height: 22px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.success};
  border: 1.5px solid ${({ theme }) => theme.colors.ink};
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
`;

export const ItemLabel = styled.span`
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.ink};
  text-align: center;
`;

export const EmptyStateCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.leaf};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
  text-align: center;
  width: 100%;
  box-sizing: border-box;
`;

/* Styled SVG elements */
export const SvgWearableIcon = styled.svg`
  width: 36px;
  height: 36px;
  display: block;
`;

export const SvgTickIcon = styled.svg`
  width: 14px;
  height: 14px;
  display: block;
`;

export const SvgPath = styled.path``;
export const SvgCircle = styled.circle``;
export const SvgRect = styled.rect``;
export const SvgEllipse = styled.ellipse``;
