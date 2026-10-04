import styled from "styled-components";
import type { AppTheme } from "@/theme/theme";
import { pressable } from "../Button/Button.style";

type OptionSection = keyof AppTheme["sections"] | undefined;

export const StyledOptionButton = styled.button<{ $selected: boolean; $section?: OptionSection }>`
  ${pressable}
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-height: 96px;
  min-width: ${({ theme }) => theme.touchTarget};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme, $selected, $section }) =>
    $selected
      ? $section
        ? theme.sections[$section].strong
        : theme.colors.highlight
      : theme.colors.surface};
  color: ${({ theme, $selected, $section }) =>
    $selected && $section ? theme.sections[$section].onStrong : theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.leaf};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSize.md};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  cursor: pointer;

  /* The selected option reads as pressed in: its shadow is gone and it sits a little lower. */
  ${({ $selected }) => ($selected ? "box-shadow: none; transform: translate(2px, 3px);" : "")}

  &:hover:not(:disabled) {
    background: ${({ theme, $selected, $section }) =>
      $selected
        ? $section
          ? theme.sections[$section].strong
          : theme.colors.highlight
        : theme.colors.primarySoft};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const OptionIcon = styled.span`
  font-size: 2.5rem;
  line-height: 1;
`;

export const OptionLabel = styled.span`
  text-align: center;
`;
