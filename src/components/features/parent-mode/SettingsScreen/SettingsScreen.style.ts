import styled from "styled-components";

export const SettingsContainer = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  max-width: ${({ theme }) => theme.maxContentWidth};
  margin: 0 auto;
`;

export const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
`;

export const HiddenFileInput = styled.input`
  display: none;
`;

export const AlertBox = styled.div<{ $variant?: "urgent" | "info" | "success" }>`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme, $variant }) => {
    if ($variant === "urgent") return theme.colors.background;
    if ($variant === "success") return theme.colors.successSoft;
    return theme.colors.primarySoft;
  }};
  border: 1px solid
    ${({ theme, $variant }) => {
      if ($variant === "urgent") return theme.colors.urgent;
      if ($variant === "success") return theme.colors.success;
      return theme.colors.primary;
    }};
  color: ${({ theme, $variant }) => {
    if ($variant === "urgent") return theme.colors.urgent;
    if ($variant === "success") return theme.colors.success;
    return theme.colors.text;
  }};
  font-size: ${({ theme }) => theme.fontSize.sm};
  line-height: 1.4;
`;
