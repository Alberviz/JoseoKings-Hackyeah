import Link from "next/link";
import styled from "styled-components";
import type { ParentSection } from "../sections";
import { pressable } from "@/components/ui/Button/Button.style";

const TAB_HEIGHT = "56px";
const FLOAT_GAP = "12px";
// Tray = tabs + its padding and border; the spacer keeps page content above the floating bar.
const TRAY_HEIGHT = `calc(${TAB_HEIGHT} + 15px)`;

export const NavSpacer = styled.div`
  height: calc(${TRAY_HEIGHT} + ${FLOAT_GAP} * 2 + env(safe-area-inset-bottom));

  @media print {
    display: none;
  }
`;

// Full-width and transparent so the tray can float; only the tray itself takes taps.
export const NavBar = styled.nav`
  position: fixed;
  inset: auto 0 0 0;
  z-index: 20;
  display: flex;
  justify-content: center;
  padding: 0 ${({ theme }) => theme.spacing.sm} calc(${FLOAT_GAP} + env(safe-area-inset-bottom));
  pointer-events: none;

  @media print {
    display: none;
  }
`;

export const NavList = styled.ul`
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
  display: flex;
  gap: 4px;
  width: 100%;
  max-width: ${({ theme }) => theme.maxContentWidth};
  margin: 0;
  padding: 5px;
  list-style: none;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 22px;
  pointer-events: auto;
`;

export const NavItem = styled.li`
  flex: 1;
  min-width: 0;
`;

type TabProps = { $isActive: boolean; $section: ParentSection };

const tabStyles = ({
  theme,
  $isActive,
  $section,
}: TabProps & { theme: import("styled-components").DefaultTheme }) => `
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 100%;
  min-height: ${TAB_HEIGHT};
  padding: 3px 1px;
  border: ${theme.borderWidth} solid ${$isActive ? theme.colors.ink : "transparent"};
  border-radius: 16px;
  background: ${$isActive ? theme.sections[$section].fill : "transparent"};
  color: ${$isActive ? theme.colors.ink : theme.colors.textMuted};
  font-family: inherit;
  font-size: ${theme.fontSize.sm};
  font-weight: ${$isActive ? theme.fontWeight.bold : theme.fontWeight.medium};
  text-decoration: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  user-select: none;
`;

export const TabLink = styled(Link)<TabProps>`
  ${tabStyles}
`;

export const TabButton = styled.button<TabProps>`
  ${tabStyles}
`;

// The More sheet floats just above the tray, with the same sticker look.
export const MorePanel = styled.div`
  position: fixed;
  inset: auto 0 calc(${TRAY_HEIGHT} + ${FLOAT_GAP} * 2 + env(safe-area-inset-bottom)) 0;
  z-index: 19;
  display: flex;
  justify-content: center;
  padding: 0 ${({ theme }) => theme.spacing.sm};
  pointer-events: none;

  @media print {
    display: none;
  }
`;

export const MoreInner = styled.div`
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  max-width: ${({ theme }) => theme.maxContentWidth};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  pointer-events: auto;
`;

// Round sticker at the top right of every parent screen, scrolling with the page.
export const SettingsLink = styled(Link)`
  ${pressable}
  position: absolute;
  top: calc(${({ theme }) => theme.spacing.lg} + 4px);
  right: max(
    ${({ theme }) => theme.spacing.md},
    calc((100vw - ${({ theme }) => theme.maxContentWidth}) / 2 + ${({ theme }) => theme.spacing.md})
  );
  z-index: 15;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  user-select: none;
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
