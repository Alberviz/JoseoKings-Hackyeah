import styled from "styled-components";

export const TimerContainer = styled.div<{ $size: number }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => `${$size}px`};
  height: ${({ $size }) => `${$size}px`};
  flex-shrink: 0;
`;

export const TimerSvg = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
`;

export const TrackCircle = styled.circle`
  fill: none;
  stroke: ${({ theme }) => theme.colors.border};
`;

export const ProgressCircle = styled.circle`
  fill: none;
  stroke: ${({ theme }) => theme.colors.primary};
  stroke-linecap: round;
  transition: stroke-dashoffset 250ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const TimeDisplay = styled.span`
  position: relative;
  font-size: ${({ theme }) => theme.fontSize.xxl};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
  font-variant-numeric: tabular-nums;
  user-select: none;
`;

export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
