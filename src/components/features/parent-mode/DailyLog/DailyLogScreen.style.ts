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
export const SleepSliderCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
`;

export const SleepSliderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const SleepValueBadge = styled.span<{ $active?: boolean }>`
  font-size: ${({ theme }) => theme.fontSize.lg};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.textMuted)};
`;

export const SleepControlsRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
`;

export const SleepStepperButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: ${({ theme }) => theme.touchTarget};
  min-height: ${({ theme }) => theme.touchTarget};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  cursor: pointer;
  touch-action: manipulation;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primarySoft};
  }

  &:active:not(:disabled) {
    transform: scale(0.96);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const StyledRangeInput = styled.input.attrs({ type: "range" })`
  flex: 1;
  height: ${({ theme }) => theme.touchTarget};
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
  margin: 0;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 4px;
    border-radius: ${({ theme }) => theme.radius.sm};
  }

  &::-webkit-slider-runnable-track {
    width: 100%;
    height: 10px;
    background: ${({ theme }) => theme.colors.primarySoft};
    border: 1px solid ${({ theme }) => theme.colors.ink};
    border-radius: ${({ theme }) => theme.radius.pill};
  }

  &::-moz-range-track {
    width: 100%;
    height: 10px;
    background: ${({ theme }) => theme.colors.primarySoft};
    border: 1px solid ${({ theme }) => theme.colors.ink};
    border-radius: ${({ theme }) => theme.radius.pill};
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primary};
    border: 2px solid ${({ theme }) => theme.colors.ink};
    box-shadow: 0 2px 4px rgba(31, 47, 107, 0.25);
    margin-top: -12px;
    cursor: grab;
    transition: transform 0.1s ease;
  }

  &::-webkit-slider-thumb:active {
    cursor: grabbing;
    transform: scale(1.15);
  }

  &::-moz-range-thumb {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primary};
    border: 2px solid ${({ theme }) => theme.colors.ink};
    box-shadow: 0 2px 4px rgba(31, 47, 107, 0.25);
    cursor: grab;
    transition: transform 0.1s ease;
  }

  &::-moz-range-thumb:active {
    cursor: grabbing;
    transform: scale(1.15);
  }
`;

export const QuickPillRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`;

export const QuickPillButton = styled.button<{ $selected?: boolean }>`
  min-height: ${({ theme }) => theme.touchTarget};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border: 1px solid
    ${({ theme, $selected }) => ($selected ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme, $selected }) => ($selected ? theme.colors.primarySoft : theme.colors.background)};
  color: ${({ theme, $selected }) => ($selected ? theme.colors.primary : theme.colors.text)};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;
