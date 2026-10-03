import styled from "styled-components";

export const StyledDialog = styled.dialog`
  width: min(
    calc(100% - ${({ theme }) => theme.spacing.xl}),
    ${({ theme }) => theme.maxContentWidth}
  );
  padding: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};

  &::backdrop {
    background: rgba(29, 27, 34, 0.55);
  }
`;

export const DialogTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.fontSize.xl};
`;

export const DialogBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const CloseButton = styled.button`
  margin-top: ${({ theme }) => theme.spacing.lg};
  min-height: ${({ theme }) => theme.touchTarget};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  color: ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.surface};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.pill};
  font: inherit;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  cursor: pointer;
`;
