"use client";

import { Fill, Track } from "./ProgressBar.style";

type ProgressBarProps = {
  value: number;
  max: number;
  /** What the bar measures. Read by screen readers. */
  label: string;
};

// Progress only ever fills up: the bar never uses the urgent color.
export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const percent = Math.round((clamped / safeMax) * 100);

  return (
    <Track
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={clamped}
    >
      <Fill $percent={percent} />
    </Track>
  );
}
