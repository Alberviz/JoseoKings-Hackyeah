import Link from "next/link";
import styled from "styled-components";
import { pressable } from "@/components/ui/Button/Button.style";

const NAV_HEIGHT = "64px";

export const NavSpacer = styled.div`
  height: calc(${NAV_HEIGHT} + env(safe-area-inset-bottom));

  @media print {
    display: none;
  }
`;

export const NavBar = styled.nav`
  position: fixed;
  inset: auto 0 0 0;
  z-index: 20;
  display: flex;
  justify-content: center;
  padding-bottom: env(safe-area-inset-bottom);
  background: ${({ theme }) => theme.colors.surface};
  border-top: ${({ theme }) => `${theme.borderWidth} solid ${theme.colors.ink}`};

  @media print {
    display: none;
  }
`;

export const NavList = styled.ul`
  display: flex;
  width: 100%;
  max-width: ${({ theme }) => theme.maxContentWidth};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const NavItem = styled.li`
  flex: 1;
  min-width: 0;
`;

type TabProps = { $isActive: boolean };

const tabStyles = ({
  theme,
  $isActive,
}: TabProps & { theme: import("styled-components").DefaultTheme }) => `
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 100%;
  min-height: ${NAV_HEIGHT};
  padding: 4px 2px;
  border: 0;
  background: ${$isActive ? theme.colors.primarySoft : "transparent"};
  color: ${$isActive ? theme.colors.primaryHover : theme.colors.textMuted};
  font-family: inherit;
  font-size: ${theme.fontSize.sm};
  font-weight: ${$isActive ? theme.fontWeight.bold : theme.fontWeight.medium};
  text-decoration: none;
  cursor: pointer;
`;

export const TabLink = styled(Link)<TabProps>`
  ${tabStyles}
`;

export const TabButton = styled.button<TabProps>`
  ${tabStyles}
`;

export const MorePanel = styled.div`
  position: fixed;
  inset: auto 0 calc(${NAV_HEIGHT} + env(safe-area-inset-bottom)) 0;
  z-index: 19;
  display: flex;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  border-top: ${({ theme }) => `${theme.borderWidth} solid ${theme.colors.ink}`};

  @media print {
    display: none;
  }
`;

export const MoreInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  max-width: ${({ theme }) => theme.maxContentWidth};
`;

// Round sticker at the top right of every parent screen, scrolling with the page.
export const SettingsLink = styled(Link)`
  ${pressable}
  position: absolute;
  top: ${({ theme }) => theme.spacing.sm};
  right: max(
    ${({ theme }) => theme.spacing.md},
    calc((100vw - ${({ theme }) => theme.maxContentWidth}) / 2 + ${({ theme }) => theme.spacing.md})
  );
  z-index: 15;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.touchTarget};
  height: ${({ theme }) => theme.touchTarget};
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.surface};

  @media print {
    display: none;
  }
`;
