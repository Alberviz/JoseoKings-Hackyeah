import styled, { css } from "styled-components";

export type CalendarDayStatus = "calm" | "mild" | "discomfort" | "not-today" | "no-data";

export const CalendarBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const CalendarHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${({ theme }) => theme.spacing.xs};
  width: 100%;
`;

export const WeekdayHeader = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xs} 0;
`;

export const DayCellButton = styled.button<{
  $status: CalendarDayStatus;
  $selected: boolean;
}>`
  min-height: ${({ theme }) => theme.touchTarget};
  min-width: 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: ${({ theme }) => theme.radius.sm};
  cursor: pointer;
  padding: 4px;
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  transition: all 0.15s ease-in-out;

  ${({ $status, theme }) => {
    switch ($status) {
      case "calm":
        return css`
          background-color: ${theme.colors.successSoft};
          border: 1.5px solid ${theme.colors.success};
          color: ${theme.colors.success};
        `;
      case "mild":
        return css`
          background-color: ${theme.colors.background};
          border: 1.5px solid ${theme.colors.focus};
          color: ${theme.colors.text};
        `;
      case "discomfort":
        return css`
          background-color: ${theme.colors.surface};
          border: 1.5px solid ${theme.colors.urgent};
          color: ${theme.colors.urgent};
        `;
      case "not-today":
        return css`
          background-color: ${theme.colors.primarySoft};
          border: 1.5px solid ${theme.colors.primary};
          color: ${theme.colors.primary};
        `;
      case "no-data":
      default:
        return css`
          background-color: ${theme.colors.background};
          border: 1px dashed ${theme.colors.border};
          color: ${theme.colors.textMuted};
        `;
    }
  }}

  ${({ $selected, theme }) =>
    $selected &&
    css`
      outline: 3px solid ${theme.colors.focus};
      outline-offset: 1px;
    `}

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 1px;
  }
`;

export const StatusDot = styled.span<{ $status: CalendarDayStatus }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  ${({ $status, theme }) => {
    switch ($status) {
      case "calm":
        return css`
          background-color: ${theme.colors.success};
        `;
      case "mild":
        return css`
          background-color: ${theme.colors.focus};
        `;
      case "discomfort":
        return css`
          background-color: ${theme.colors.urgent};
        `;
      case "not-today":
        return css`
          background-color: ${theme.colors.primary};
        `;
      case "no-data":
      default:
        return css`
          background-color: transparent;
        `;
    }
  }}
`;

export const LegendContainer = styled.footer`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const LegendDot = styled.span<{ $status: CalendarDayStatus }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  ${({ $status, theme }) => {
    switch ($status) {
      case "calm":
        return css`
          background-color: ${theme.colors.success};
          border: 1px solid ${theme.colors.success};
        `;
      case "mild":
        return css`
          background-color: ${theme.colors.focus};
          border: 1px solid ${theme.colors.focus};
        `;
      case "discomfort":
        return css`
          background-color: ${theme.colors.urgent};
          border: 1px solid ${theme.colors.urgent};
        `;
      case "not-today":
        return css`
          background-color: ${theme.colors.primary};
          border: 1px solid ${theme.colors.primary};
        `;
      case "no-data":
      default:
        return css`
          background-color: ${theme.colors.background};
          border: 1px dashed ${theme.colors.border};
        `;
    }
  }}
`;

export const SelectedDayInfo = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const DayInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.fontSize.sm};
`;

export const DayInfoLabel = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const DayInfoValue = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
`;

export const DayNumber = styled.span`
  display: block;
`;

export const LegendLabel = styled.span`
  display: inline-block;
`;

export const DayCellEmpty = styled.div`
  min-height: ${({ theme }) => theme.touchTarget};
`;
