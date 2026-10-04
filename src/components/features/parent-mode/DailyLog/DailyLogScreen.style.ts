import styled from "styled-components";

export const DailyLogContainer = styled.section`
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

export const DateNav = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
`;

export const DateLabel = styled.p`
  flex: 1;
  margin: 0;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize.md};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
`;

export const ConsultationList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const ConsultationItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  min-height: ${({ theme }) => theme.touchTarget};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.background};
`;

export const AlertBox = styled.div<{ $variant?: "urgent" | "success" | "info" }>`
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

export const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;
