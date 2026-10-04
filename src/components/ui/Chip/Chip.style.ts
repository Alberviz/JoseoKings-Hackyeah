import styled, { css } from "styled-components";
import { pressable } from "../Button/Button.style";

export type ChipTone = "default" | "primary" | "success" | "mixed" | "harder";

// Text is always ink; the tone only changes the fill, so every tone keeps high contrast.
const toneStyles = {
  default: css`
    background: ${({ theme }) => theme.colors.surface};
  `,
  primary: css`
    background: ${({ theme }) => theme.colors.primarySoft};
  `,
  success: css`
    background: ${({ theme }) => theme.colors.successSoft};
  `,
  mixed: css`
    background: ${({ theme }) => theme.colors.highlight};
  `,
  harder: css`
    background: ${({ theme }) => theme.colors.coralSoft};
  `,
};

const chipBase = css<{ $tone: ChipTone }>`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  color: ${({ theme }) => theme.colors.ink};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.pill};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  ${({ $tone }) => toneStyles[$tone]}
`;

export const ChipTag = styled.span<{ $tone: ChipTone }>`
  ${chipBase}
`;

// A toggle keeps the 48 px touch target. The selected state is yellow and pressed in.
export const ChipButton = styled.button<{ $tone: ChipTone; $selected: boolean }>`
  ${chipBase}
  ${pressable}
  min-height: ${({ theme }) => theme.touchTarget};
  padding-inline: ${({ theme }) => theme.spacing.lg};
  cursor: pointer;
  ${({ theme, $selected }) =>
    $selected
      ? css`
          background: ${theme.colors.highlight};
          box-shadow: none;
          transform: translate(2px, 3px);
        `
      : ""}
`;
