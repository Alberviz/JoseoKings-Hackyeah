import styled from "styled-components";

export const ChartFigure = styled.figure`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  break-inside: avoid;
`;

export const ChartCaption = styled.figcaption`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.text};

  @media print {
    font-size: 7.5pt !important;
  }
`;

export const ChartRange = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const ChartSvg = styled.svg`
  width: 100%;
  height: 56px;
  display: block;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};

  @media print {
    height: 34px !important;
  }
`;

export const ChartLine = styled.path`
  fill: none;
  stroke: ${({ theme }) => theme.colors.primary};
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
`;

export const ChartDot = styled.circle`
  fill: ${({ theme }) => theme.colors.primary};
`;

/** A day the child marked discomfort: a mark on the bottom edge, not a value. */
export const MarkerDot = styled.circle`
  fill: ${({ theme }) => theme.colors.accent};
  stroke: ${({ theme }) => theme.colors.ink};
  stroke-width: 0.5;
`;

export const ChartTitle = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight.medium};
`;

export const ChartSvgTitle = styled("title")``;

/** Dashed line in the middle of a chart that has no data. */
export const EmptyBaseline = styled.line`
  stroke: currentColor;
  stroke-dasharray: 3 3;
  opacity: 0.2;
`;

/** Faint line along the bottom of a chart that has data. */
export const FloorBaseline = styled.line`
  stroke: currentColor;
  opacity: 0.08;
`;
