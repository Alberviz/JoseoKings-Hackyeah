import styled, { css } from "styled-components";

export type ButtonVariant =
  "primary" | "secondary" | "urgent" | "accent" | "success" | "lavender" | "highlight";

// Transient props ($variant) are not forwarded to the DOM.
type StyledButtonProps = {
  $variant: ButtonVariant;
  $fullWidth: boolean;
};

// Notebook sticker: ink outline plus a solid offset shadow that collapses when pressed.
// Shared by every pressable primitive (buttons, option buttons, toggle chips, dialog buttons).
export const pressable = css`
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    background-color 120ms ease;

  &:active:not(:disabled) {
    transform: translate(2px, 3px);
    box-shadow: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const variantStyles = {
  primary: css`
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.onPrimary};

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.primaryHover};
    }
  `,
  secondary: css`
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.ink};

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.primarySoft};
    }
  `,
  accent: css`
    background: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.onAccent};
  `,
  success: css`
    background: ${({ theme }) => theme.sections.log.strong};
    color: ${({ theme }) => theme.sections.log.onStrong};
  `,
  lavender: css`
    background: ${({ theme }) => theme.sections.patterns.strong};
    color: ${({ theme }) => theme.sections.patterns.onStrong};
  `,
  highlight: css`
    background: ${({ theme }) => theme.sections.more.strong};
    color: ${({ theme }) => theme.sections.more.onStrong};
  `,
  urgent: css`
    background: ${({ theme }) => theme.colors.urgent};
    color: ${({ theme }) => theme.colors.onUrgent};
    font-size: ${({ theme }) => theme.fontSize.lg};
  `,
};

export const buttonBase = css<StyledButtonProps>`
  ${pressable}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-height: ${({ theme }) => theme.touchTarget};
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  border-radius: ${({ theme, $fullWidth, $variant }) =>
    $fullWidth || $variant === "urgent" ? theme.radius.leaf : theme.radius.pill};
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.md};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  text-decoration: none;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }

  ${({ $variant }) => variantStyles[$variant]}
`;

export const StyledButton = styled.button<StyledButtonProps>`
  ${buttonBase}
`;
