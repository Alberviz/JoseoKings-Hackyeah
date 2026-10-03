import styled, { css } from "styled-components";

export const FieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const FieldLabel = styled.label`
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

const controlStyles = css<{ $hasError: boolean }>`
  width: 100%;
  min-height: ${({ theme }) => theme.touchTarget};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  border: ${({ theme }) => theme.borderWidth} solid
    ${({ theme, $hasError }) => ($hasError ? theme.colors.urgent : theme.colors.ink)};
  border-radius: ${({ theme }) => theme.radius.md};
  font: inherit;

  &:disabled {
    opacity: 0.6;
  }
`;

export const StyledInput = styled.input<{ $hasError: boolean }>`
  ${controlStyles}
`;

export const StyledTextarea = styled.textarea<{ $hasError: boolean }>`
  ${controlStyles}
  resize: vertical;
`;

export const FieldHint = styled.p<{ $isError: boolean }>`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme, $isError }) => ($isError ? theme.colors.urgent : theme.colors.textMuted)};
`;
