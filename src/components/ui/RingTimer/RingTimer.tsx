"use client";

import { useEffect, useRef, useState } from "react";
import {
  ProgressCircle,
  TimeDisplay,
  TimerContainer,
  TimerSvg,
  TrackCircle,
  VisuallyHidden,
} from "./RingTimer.style";

export type RingTimerProps = {
  remaining: number;
  progress: number;
  label: string;
  size?: number;
};

export function formatTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const STROKE_WIDTH = 10;

export function RingTimer({ remaining, progress, label, size = 160 }: RingTimerProps) {
  const [announcedSeconds, setAnnouncedSeconds] = useState(remaining);
  const lastAnnouncedRef = useRef(remaining);

  useEffect(() => {
    const diff = lastAnnouncedRef.current - remaining;
    if (
      remaining === 0 ||
      remaining % 10 === 0 ||
      diff >= 10 ||
      remaining > lastAnnouncedRef.current
    ) {
      lastAnnouncedRef.current = remaining;
      setAnnouncedSeconds(remaining);
    }
  }, [remaining]);

  const clampedProgress = Math.min(1, Math.max(0, progress));
  const strokeDashoffset = CIRCUMFERENCE * (1 - clampedProgress);
  const formattedTime = formatTime(remaining);

  const unit = announcedSeconds === 1 ? "second" : "seconds";
  const announcement = `${label}: ${announcedSeconds} ${unit} remaining`;

  return (
    <TimerContainer role="timer" aria-label={label} aria-live="off" $size={size}>
      <TimerSvg viewBox="0 0 160 160" aria-hidden="true">
        <TrackCircle cx={80} cy={80} r={RADIUS} strokeWidth={STROKE_WIDTH} />
        <ProgressCircle
          cx={80}
          cy={80}
          r={RADIUS}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 80 80)"
        />
      </TimerSvg>
      <TimeDisplay>{formattedTime}</TimeDisplay>
      <VisuallyHidden aria-live="polite" aria-atomic="true">
        {announcement}
      </VisuallyHidden>
    </TimerContainer>
  );
}
