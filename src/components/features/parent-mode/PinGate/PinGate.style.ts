import styled from "styled-components";

export const GateContainer = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  max-width: ${({ theme }) => theme.maxContentWidth};
  margin: 0 auto;
`;

export const GateForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
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
