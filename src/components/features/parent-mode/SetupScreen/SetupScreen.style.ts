import styled from "styled-components";

export const SetupContainer = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  max-width: ${({ theme }) => theme.maxContentWidth};
  margin: 0 auto;
`;

export const SetupForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
`;

export const ChipWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const ErrorText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.urgent};
`;

export const AlertBox = styled.div<{ $variant?: "urgent" | "info" }>`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme, $variant }) =>
    $variant === "urgent" ? theme.colors.background : theme.colors.primarySoft};
  border: 1px solid
    ${({ theme, $variant }) => ($variant === "urgent" ? theme.colors.urgent : theme.colors.primary)};
  color: ${({ theme, $variant }) =>
    $variant === "urgent" ? theme.colors.urgent : theme.colors.text};
  font-size: ${({ theme }) => theme.fontSize.sm};
  line-height: 1.4;
`;
