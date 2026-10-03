import styled from "styled-components";
import type { AppTheme } from "@/theme/theme";

export const ChartCard = styled.article`
  background-color: ${({ theme }) => theme.colors.surface};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const ChartHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const MetricTabs = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding-bottom: ${({ theme }) => theme.spacing.sm};
`;

export const MetricTabButton = styled.button<{ $active: boolean }>`
  min-height: ${({ theme }) => theme.touchTarget};
  padding: 0 ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  border: 1.5px solid
    ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.border)};
  background-color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.surface};
  color: ${({ $active, theme }) => ($active ? theme.colors.onPrimary : theme.colors.text)};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 1px;
  }
`;

export const TableToggleButton = styled.button`
  align-self: flex-start;
  min-height: ${({ theme }) => theme.touchTarget};
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  cursor: pointer;
  text-decoration: underline;
  padding: 0;

  &:hover {
    text-decoration: none;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const ChartSvgWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  padding: ${({ theme }) => theme.spacing.xs} 0;
`;

export const SvgRoot = styled.svg`
  width: 100%;
  max-width: 480px;
  height: auto;
  display: block;
  margin: 0 auto;
`;

export const SvgLine = styled.line`
  stroke: ${({ theme }) => theme.colors.border};
  stroke-width: 1;
  stroke-dasharray: 3 3;
`;

export const SvgAxisLine = styled.line`
  stroke: ${({ theme }) => theme.colors.textMuted};
  stroke-width: 1.5;
`;

export const SvgTrendLine = styled.polyline<{ $colorToken?: keyof AppTheme["colors"] }>`
  fill: none;
  stroke: ${({ $colorToken, theme }) =>
    $colorToken ? theme.colors[$colorToken] : theme.colors.primary};
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

export const SvgCircle = styled.circle<{ $colorToken?: keyof AppTheme["colors"] }>`
  fill: ${({ $colorToken, theme }) =>
    $colorToken ? theme.colors[$colorToken] : theme.colors.primary};
  stroke: ${({ theme }) => theme.colors.surface};
  stroke-width: 2;
  transition: r 0.15s ease-in-out;

  &:hover {
    r: 6.5;
  }
`;

export const SvgGroup = styled.g``;

export const SvgText = styled.text`
  fill: ${({ theme }) => theme.colors.textMuted};
  font-size: 11px;
  font-family: inherit;
`;

export const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

export const TableRoot = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${({ theme }) => theme.fontSize.sm};
`;

export const TableHead = styled.thead`
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
`;

export const TableBody = styled.tbody``;

export const TableRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const TableHeaderCell = styled.th`
  padding: ${({ theme }) => theme.spacing.sm};
  text-align: left;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const TableCell = styled.td`
  padding: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text};
`;
