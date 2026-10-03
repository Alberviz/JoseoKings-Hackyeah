import styled, { css } from "styled-components";

export type ChipTone = "default" | "primary" | "success";

const toneStyles = {
  default: css`
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
    border-color: ${({ theme }) => theme.colors.border};
  `,
  primary: css`
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primarySoft};
  `,
  success: css`
    background: ${({ theme }) => theme.colors.successSoft};
    color: ${({ theme }) => theme.colors.success};
    border-color: ${({ theme }) => theme.colors.successSoft};
  `,
};

const chipBase = css<{ $tone: ChipTone }>`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  border: 2px solid transparent;
  border-radius: ${({ theme }) => theme.radius.pill};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  ${({ $tone }) => toneStyles[$tone]}
`;

export const ChipTag = styled.span<{ $tone: ChipTone }>`
  ${chipBase}
`;

// A toggle keeps the 48 px touch target. The selected state uses a thicker primary border.
export const ChipButton = styled.button<{ $tone: ChipTone; $selected: boolean }>`
  ${chipBase}
  min-height: ${({ theme }) => theme.touchTarget};
  padding-inline: ${({ theme }) => theme.spacing.lg};
  cursor: pointer;
  border-color: ${({ theme, $selected }) => ($selected ? theme.colors.primary : theme.colors.border)};
`;
