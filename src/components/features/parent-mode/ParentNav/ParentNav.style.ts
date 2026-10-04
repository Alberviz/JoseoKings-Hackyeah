import Link from "next/link";
import styled, { css } from "styled-components";
import type { ParentSection } from "../sections";
import { pressable } from "@/components/ui/Button/Button.style";

const TAB_HEIGHT = "56px";
const FLOAT_GAP = "16px";
// Tray = tabs + its padding and border; the spacer keeps page content above the floating bar.
const TRAY_HEIGHT = `calc(${TAB_HEIGHT} + 17px)`;

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
  padding: 0 ${({ theme }) => theme.spacing.lg} calc(${FLOAT_GAP} + env(safe-area-inset-bottom));
  pointer-events: none;

  @media print {
    display: none;
  }
`;

export const NavList = styled.ul`
  display: flex;
  width: 100%;
  max-width: calc(${({ theme }) => theme.maxContentWidth} - 2 * ${({ theme }) => theme.spacing.lg});
  margin: 0;
  padding: 6px ${({ theme }) => theme.spacing.sm};
  list-style: none;
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.pill};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
  pointer-events: auto;
`;

export const NavItem = styled.li`
  flex: 1;
  min-width: 0;
`;

type TabProps = { $isActive: boolean; $section: ParentSection };

// Material 3 pattern: the indicator is a pill around the icon, the label sits below it.
export const TabIconPill = styled.span<TabProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 32px;
  border: ${({ theme }) => theme.borderWidth} solid
    ${({ theme, $isActive }) => ($isActive ? theme.colors.ink : "transparent")};
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme, $isActive, $section }) =>
    $isActive ? theme.sections[$section].fill : "transparent"};
  transition: transform 120ms ease;
`;

export const TabLink = styled(Link)<TabProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 100%;
  min-height: ${TAB_HEIGHT};
  padding: 2px 0;
  color: ${({ theme, $isActive }) => ($isActive ? theme.colors.ink : theme.colors.textMuted)};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme, $isActive }) =>
    $isActive ? theme.fontWeight.bold : theme.fontWeight.medium};
  text-decoration: none;
  cursor: pointer;
  -webkit-touch-callout: none;
  user-select: none;

  &:active ${TabIconPill} {
    transform: scale(0.92);
  }
`;

// The Exit sheet floats just above the tray, with the same sticker look.
export const ExitPanel = styled.div`
  position: fixed;
  inset: auto 0 calc(${TRAY_HEIGHT} + ${FLOAT_GAP} * 2 + env(safe-area-inset-bottom)) 0;
  z-index: 19;
  display: flex;
  justify-content: center;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  pointer-events: none;

  @media print {
    display: none;
  }
`;

export const ExitInner = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  max-width: calc(${({ theme }) => theme.maxContentWidth} - 2 * ${({ theme }) => theme.spacing.lg});
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.leaf};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
  pointer-events: auto;
`;

type TileFill = "more" | "patterns" | "summary" | "surface";

const tileStyles = css<{ $fill: TileFill }>`
  ${pressable}
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  min-height: 96px;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme, $fill }) =>
    $fill === "surface" ? theme.colors.surface : theme.sections[$fill].fill};
  color: ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.leaf};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  text-align: center;
  text-decoration: none;
  cursor: pointer;
`;

// Sticker tiles in the Exit sheet: a drawn icon over a short label.
export const ExitTileLink = styled(Link)<{ $fill: TileFill }>`
  ${tileStyles}
`;

export const ExitTileButton = styled.button<{ $fill: TileFill }>`
  ${tileStyles}
`;

// Round stickers at the top right of every parent screen, scrolling with the page.
const stickerBase = css`
  ${pressable}
  position: absolute;
  top: calc(${({ theme }) => theme.spacing.lg} + 4px);
  z-index: 15;
  -webkit-touch-callout: none;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.touchTarget};
  height: ${({ theme }) => theme.touchTarget};
  padding: 0;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.surface};
  cursor: pointer;

  @media print {
    display: none;
  }
`;

// Distance of the right-most sticker from the screen edge, following the centred column.
const stickerEdge = (extra: string) => css`
  right: max(
    calc(${({ theme }) => theme.spacing.md} + ${extra}),
    calc(
      (100vw - ${({ theme }) => theme.maxContentWidth}) / 2 + ${({ theme }) => theme.spacing.md} +
        ${extra}
    )
  );
`;

export const ExitButton = styled.button`
  ${stickerBase}
  ${stickerEdge("0px")}
`;

export const SettingsLink = styled(Link)`
  ${stickerBase}
  ${({ theme }) => stickerEdge(`${theme.touchTarget} + ${theme.spacing.sm}`)}
`;
