import styled from "styled-components";
import type { DayTone } from "@/content/wearable-summary";
import type { AppTheme } from "@/theme/theme";

function toneColor(tone: DayTone) {
  return ({ theme }: { theme: AppTheme }) => {
    return tone === "recorded" ? theme.colors.statusUsual : theme.colors.statusUnknown;
  };
}

export const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const StatusDot = styled.span<{ $tone: DayTone }>`
  display: inline-block;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radius.pill};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  background: ${({ $tone }) => toneColor($tone)};
`;

export const StripList = styled.ol`
  list-style: none;
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.xs};
  margin: 0;
  padding: 0;
`;

export const StripItem = styled.li`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const StripDot = styled.span<{ $tone: DayTone }>`
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: ${({ theme }) => theme.radius.pill};
  border: 2px solid ${({ theme }) => theme.colors.ink};
  background: ${({ $tone }) => toneColor($tone)};
`;

export const StripDay = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const HiddenText = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`;
