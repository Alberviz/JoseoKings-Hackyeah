"use client";

import type { ReactNode } from "react";
import {
  IconSvg,
  InkCircle,
  InkPath,
  InkRect,
} from "../../child-mode/CheckInIcons/CheckInIcons.style";

export type ParentNavIconKey =
  | "summary"
  | "log"
  | "food"
  | "patterns"
  | "more"
  | "settings"
  | "report"
  | "link"
  | "lock"
  | "child";

type ParentNavIconProps = {
  iconKey: ParentNavIconKey;
  size?: number;
};

// Eight gear teeth, each one a short rounded rectangle turned around the centre.
const GEAR_TEETH = [0, 45, 90, 135];

const DRAWINGS: Record<ParentNavIconKey, ReactNode> = {
  summary: (
    <>
      <InkPath d="M7 23 L24 8 L41 23 Z" $fill="accent" />
      <InkPath d="M11 22 V40 H37 V22" $fill="surface" />
      <InkRect x="20" y="28" width="9" height="12" rx="2" $fill="highlight" />
    </>
  ),
  log: (
    <>
      <InkRect x="9" y="6" width="30" height="37" rx="4" $fill="surface" />
      <InkRect x="9" y="6" width="9" height="37" rx="3" $fill="primarySoft" />
      <InkPath d="M23 18 H34 M23 26 H34 M23 34 H30" />
    </>
  ),
  food: (
    <>
      <InkPath
        d="M24 15 C16 9 6 15 8 28 C10 40 18 44 24 41 C30 44 38 40 40 28 C42 15 32 9 24 15 Z"
        $fill="accent"
      />
      <InkPath d="M24 15 C24 10 26 7 29 5" />
      <InkPath d="M27 9 C31 5 36 6 37 9 C33 12 29 12 27 9 Z" $fill="success" />
    </>
  ),
  patterns: (
    <>
      <InkPath d="M7 6 V41 H43" />
      <InkRect x="13" y="26" width="7" height="15" rx="1.5" $fill="lavender" />
      <InkRect x="24" y="17" width="7" height="24" rx="1.5" $fill="primarySoft" />
      <InkRect x="35" y="9" width="7" height="32" rx="1.5" $fill="highlight" />
    </>
  ),
  more: (
    <>
      <InkRect x="5" y="9" width="38" height="30" rx="10" $fill="lavender" />
      <InkCircle cx="15" cy="24" r="3.2" $solid />
      <InkCircle cx="24" cy="24" r="3.2" $solid />
      <InkCircle cx="33" cy="24" r="3.2" $solid />
    </>
  ),
  report: (
    <>
      <InkRect x="10" y="8" width="28" height="35" rx="4" $fill="surface" />
      <InkRect x="17" y="4" width="14" height="9" rx="3" $fill="highlight" />
      <InkPath d="M16 22 H32 M16 29 H32 M16 36 H26" />
    </>
  ),
  link: (
    <>
      <InkRect
        x="3"
        y="17"
        width="27"
        height="14"
        rx="7"
        $fill="mint"
        transform="rotate(-35 24 24)"
      />
      <InkRect
        x="18"
        y="17"
        width="27"
        height="14"
        rx="7"
        $fill="lavender"
        transform="rotate(-35 24 24)"
      />
    </>
  ),
  lock: (
    <>
      <InkPath d="M15 22 V15 C15 6 33 6 33 15 V22" />
      <InkRect x="9" y="21" width="30" height="22" rx="5" $fill="highlight" />
      <InkCircle cx="24" cy="30" r="3" $solid />
      <InkPath d="M24 32 V37" />
    </>
  ),
  child: (
    <>
      <InkCircle cx="24" cy="24" r="19" $fill="highlight" />
      <InkCircle cx="17" cy="21" r="2.4" $solid />
      <InkCircle cx="31" cy="21" r="2.4" $solid />
      <InkPath d="M15 29 Q24 38 33 29" />
    </>
  ),
  settings: (
    <>
      {GEAR_TEETH.map((angle) => (
        <InkRect
          key={angle}
          x="20"
          y="3"
          width="8"
          height="42"
          rx="3"
          transform={`rotate(${angle} 24 24)`}
          $fill="highlight"
        />
      ))}
      <InkCircle cx="24" cy="24" r="14" $fill="highlight" />
      <InkCircle cx="24" cy="24" r="5.5" $fill="surface" />
    </>
  ),
};

// Hand-drawn parent navigation icons. Always decorative: the label sits next to them.
export function ParentNavIcon({ iconKey, size = 28 }: ParentNavIconProps) {
  return (
    <IconSvg $size={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      {DRAWINGS[iconKey]}
    </IconSvg>
  );
}
