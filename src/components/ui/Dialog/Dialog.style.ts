import styled from "styled-components";
import { pressable } from "../Button/Button.style";

export const StyledDialog = styled.dialog`
  width: min(
    calc(100% - ${({ theme }) => theme.spacing.xl}),
    ${({ theme }) => theme.maxContentWidth}
  );
  padding: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.ink};
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.leaf};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};

  &::backdrop {
    background: ${({ theme }) => theme.colors.overlay};
  }
`;

export const DialogTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.xl};
`;

export const DialogBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const CloseButton = styled.button`
  ${pressable}
  margin-top: ${({ theme }) => theme.spacing.lg};
  min-height: ${({ theme }) => theme.touchTarget};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  color: ${({ theme }) => theme.colors.ink};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.pill};
  font: inherit;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  cursor: pointer;
`;
