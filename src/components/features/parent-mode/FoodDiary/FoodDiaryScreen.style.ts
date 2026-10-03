import styled from "styled-components";

export const FoodDiaryContainer = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  max-width: ${({ theme }) => theme.maxContentWidth};
  margin: 0 auto;
`;

export const FoodForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
`;

export const PromptBanner = styled.aside`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primarySoft};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const FoodEntryList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const FoodEntryItem = styled.li`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
`;

export const FoodEntryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const FoodEntryDate = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
`;

export const FoodEntryText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize.md};
  color: ${({ theme }) => theme.colors.text};
  white-space: pre-wrap;
  word-break: break-word;
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

export const DiscomfortBadge = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.urgent};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
`;
