import styled, { css } from "styled-components";

export type ButtonVariant = "primary" | "secondary" | "urgent";

// Transient props ($variant) are not forwarded to the DOM.
type StyledButtonProps = {
  $variant: ButtonVariant;
  $fullWidth: boolean;
};

const variantStyles = {
  primary: css`
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.onPrimary};
    border-color: ${({ theme }) => theme.colors.primary};

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.primaryHover};
    }
  `,
  secondary: css`
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.border};
  `,
  urgent: css`
    background: ${({ theme }) => theme.colors.urgent};
    color: ${({ theme }) => theme.colors.onUrgent};
    border-color: ${({ theme }) => theme.colors.urgent};
    font-size: ${({ theme }) => theme.fontSize.lg};
  `,
};

export const buttonBase = css<StyledButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-height: ${({ theme }) => theme.touchTarget};
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  border: 2px solid transparent;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: ${({ theme }) => theme.fontSize.md};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  text-decoration: none;
  cursor: pointer;
  transition: background 150ms ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${({ $variant }) => variantStyles[$variant]}
`;

export const StyledButton = styled.button<StyledButtonProps>`
  ${buttonBase}
`;
