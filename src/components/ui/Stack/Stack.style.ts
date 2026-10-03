import styled from "styled-components";
import type { AppTheme } from "@/theme/theme";

export type StackGap = keyof AppTheme["spacing"];
export type StackDirection = "row" | "column";
export type StackAlign = "start" | "center" | "end" | "stretch";

type StackContainerProps = {
  $gap: StackGap;
  $direction: StackDirection;
  $align: StackAlign;
};

export const StackContainer = styled.div<StackContainerProps>`
  display: flex;
  flex-direction: ${({ $direction }) => $direction};
  align-items: ${({ $align }) => ($align === "start" || $align === "end" ? `flex-${$align}` : $align)};
  gap: ${({ theme, $gap }) => theme.spacing[$gap]};
`;
