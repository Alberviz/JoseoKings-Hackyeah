import styled from "styled-components";

export const StyledOptionButton = styled.button<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-height: 96px;
  min-width: ${({ theme }) => theme.touchTarget};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme, $selected }) => ($selected ? theme.colors.primarySoft : theme.colors.surface)};
  color: ${({ theme }) => theme.colors.text};
  border: 3px solid
    ${({ theme, $selected }) => ($selected ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radius.lg};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSize.md};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  cursor: pointer;
  transition:
    background 150ms ease,
    border-color 150ms ease;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
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
