import styled from "styled-components";

export const ConfirmationContainer = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
`;

export const PinForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
`;

export const AlertBox = styled.div<{ $variant?: "urgent" | "info" }>`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.fontSize.sm};
  background: ${({ theme, $variant }) =>
    $variant === "urgent" ? theme.colors.urgent : theme.colors.primarySoft};
  color: ${({ theme, $variant }) =>
    $variant === "urgent" ? theme.colors.onUrgent : theme.colors.primary};
`;

export const ConfirmationActionBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
`;
