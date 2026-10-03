import styled from "styled-components";
import type { AppTheme } from "@/theme/theme";

export type InkFill =
  "none" | "paper" | "surface" | "primarySoft" | "mint" | "accent" | "highlight" | "lavender";

function fillColor(theme: AppTheme, fill: InkFill): string {
  return fill === "none" ? "none" : theme.colors[fill];
}

export const IconSvg = styled.svg<{ $size: number }>`
  display: block;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  flex-shrink: 0;
  overflow: visible;
`;

// Closed or open outline with a flat colour fill, like a marker drawing.
export const InkPath = styled.path<{ $fill?: InkFill; $muted?: boolean }>`
  fill: ${({ theme, $fill = "none" }) => fillColor(theme, $fill)};
  stroke: ${({ theme, $muted }) => ($muted ? theme.colors.textMuted : theme.colors.ink)};
  stroke-width: 2.4px;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: ${({ $muted }) => ($muted ? 0.55 : 1)};
`;

export const InkCircle = styled.circle<{ $fill?: InkFill; $solid?: boolean }>`
  fill: ${({ theme, $fill = "none", $solid }) =>
    $solid ? theme.colors.ink : fillColor(theme, $fill)};
  stroke: ${({ theme }) => theme.colors.ink};
  stroke-width: ${({ $solid }) => ($solid ? "0" : "2.4px")};
`;

export const InkEllipse = styled.ellipse<{ $fill?: InkFill }>`
  fill: ${({ theme, $fill = "none" }) => fillColor(theme, $fill)};
  stroke: ${({ theme }) => theme.colors.ink};
  stroke-width: 2.4px;
`;

export const InkRect = styled.rect<{ $fill?: InkFill }>`
  fill: ${({ theme, $fill = "none" }) => fillColor(theme, $fill)};
  stroke: ${({ theme }) => theme.colors.ink};
  stroke-width: 2.4px;
  stroke-linejoin: round;
`;
