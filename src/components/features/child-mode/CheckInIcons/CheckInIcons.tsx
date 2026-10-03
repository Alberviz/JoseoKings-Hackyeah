"use client";

import type { ReactNode } from "react";
import { IconSvg, InkCircle, InkEllipse, InkGroup, InkPath, InkRect } from "./CheckInIcons.style";

type CheckInIconProps = {
  /** Icon key from `src/content/check-in-questions.ts`. */
  iconKey: string;
  size?: number;
  /** Set only when no visible text sits next to the icon. Otherwise the icon is decorative. */
  label?: string;
};

type IconFrameProps = {
  size: number;
  label?: string;
  children: ReactNode;
};

function IconFrame({ size, label, children }: IconFrameProps) {
  return (
    <IconSvg
      $size={size}
      viewBox="0 0 48 48"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {children}
    </IconSvg>
  );
}

// Round belly faces: calm smile, little rumble (wavy mouth), sore (soft frown). Faces describe the belly only.
function BellyFace({ mood }: { mood: "calm" | "rumble" | "sore" }) {
  const fill = mood === "calm" ? "mint" : mood === "rumble" ? "highlight" : "lavender";
  return (
    <>
      <InkCircle cx="24" cy="24" r="17" $fill={fill} />
      {mood === "calm" ? (
        <>
          <InkPath d="M16 21 Q18.5 18 21 21" />
          <InkPath d="M27 21 Q29.5 18 32 21" />
          <InkPath d="M17 28 Q24 36 31 28" />
          <InkCircle cx="13.5" cy="27" r="2.4" $fill="accent" />
          <InkCircle cx="34.5" cy="27" r="2.4" $fill="accent" />
        </>
      ) : null}
      {mood === "rumble" ? (
        <>
          <InkCircle cx="18.5" cy="21" r="1.8" $solid />
          <InkCircle cx="29.5" cy="21" r="1.8" $solid />
          <InkPath d="M16 31 Q19 27 22 31 T28 31 T32 30" />
          <InkPath d="M2 22 Q4 19 6 22 T10 22" />
          <InkPath d="M38 22 Q40 19 42 22 T46 22" />
        </>
      ) : null}
      {mood === "sore" ? (
        <>
          <InkCircle cx="18.5" cy="22" r="1.8" $solid />
          <InkCircle cx="29.5" cy="22" r="1.8" $solid />
          <InkPath d="M15 17 L21 19" />
          <InkPath d="M33 17 L27 19" />
          <InkPath d="M18 33 Q24 28 30 33" />
          <InkPath d="M40 6 L44 10 M44 6 L40 10" />
        </>
      ) : null}
    </>
  );
}

// Three flame slots. Lit flames are coral, unlit ones are a quiet outline.
const FLAME_PATH = "M7 1 C8 6 13 8 13 14 A6 6 0 0 1 1 14 C1 10 4 9 4.5 6 C5.5 7 6.5 6.5 7 1 Z";

function EnergyFlames({ lit }: { lit: 1 | 2 | 3 }) {
  return (
    <>
      {[0, 1, 2].map((slot) => (
        <InkGroup
          key={slot}
          transform={`translate(${3 + slot * 14.5} ${slot === 1 ? 12 : 16}) scale(1.05)`}
        >
          <InkPath d={FLAME_PATH} $fill={slot < lit ? "accent" : "none"} $muted={slot >= lit} />
        </InkGroup>
      ))}
      <InkPath d="M5 40 H43" $muted />
    </>
  );
}

// Simple figures: running, walking with little pauses, resting.
function PlayFigure({ pace }: { pace: "active" | "breaks" | "resting" }) {
  if (pace === "active") {
    return (
      <>
        <InkCircle cx="29" cy="9" r="5" $fill="highlight" />
        <InkPath d="M27 15 L22 28" />
        <InkPath d="M26 18 L33 22 L38 19" />
        <InkPath d="M25 19 L18 21 L14 26" />
        <InkPath d="M22 28 L30 33 L28 43" />
        <InkPath d="M22 28 L15 35 L7 34" />
        <InkPath d="M4 14 H10 M2 20 H8" $muted />
      </>
    );
  }
  if (pace === "breaks") {
    return (
      <>
        <InkCircle cx="19" cy="9" r="5" $fill="highlight" />
        <InkPath d="M19 15 L19 29" />
        <InkPath d="M19 18 L13 25 M19 18 L25 24" />
        <InkPath d="M19 29 L14 43 M19 29 L25 43" />
        <InkRect x="33" y="14" width="4" height="14" rx="1.5" $fill="primarySoft" />
        <InkRect x="40" y="14" width="4" height="14" rx="1.5" $fill="primarySoft" />
      </>
    );
  }
  return (
    <>
      <InkPath d="M4 41 H44" $muted />
      <InkEllipse cx="26" cy="35" rx="16" ry="5" $fill="lavender" />
      <InkCircle cx="14" cy="27" r="5" $fill="highlight" />
      <InkPath d="M19 29 Q28 24 36 30" />
      <InkPath d="M32 4 H38 L32 11 H38" />
      <InkPath d="M40 13 H44 L40 18 H44" $muted />
    </>
  );
}

const ICON_DRAWINGS: Record<string, ReactNode> = {
  "belly-calm": <BellyFace mood="calm" />,
  "belly-rumble": <BellyFace mood="rumble" />,
  "belly-sore": <BellyFace mood="sore" />,
  "energy-high": <EnergyFlames lit={3} />,
  "energy-medium": <EnergyFlames lit={2} />,
  "energy-low": <EnergyFlames lit={1} />,
  "play-active": <PlayFigure pace="active" />,
  "play-breaks": <PlayFigure pace="breaks" />,
  "play-resting": <PlayFigure pace="resting" />,
};

const STAR_PATH = "M24 3 L30 18 L45 20 L33 30 L37 45 L24 37 L11 45 L15 30 L3 20 L18 18 Z";

// Hand-drawn answer icons for the daily check-in. Decorative by default: the option text sits next to them.
export function CheckInIcon({ iconKey, size = 44, label }: CheckInIconProps) {
  return (
    <IconFrame size={size} label={label}>
      {ICON_DRAWINGS[iconKey] ?? <InkPath d={STAR_PATH} $fill="highlight" />}
    </IconFrame>
  );
}

// Big sparkle for the saved screen.
export function CheckInStar({ size = 64 }: { size?: number }) {
  return (
    <IconFrame size={size}>
      <InkPath d={STAR_PATH} $fill="highlight" />
      <InkPath d="M19 24 Q24 29 29 24" />
    </IconFrame>
  );
}

// Small check mark shown on the chosen option, so the selection is not colour only.
export function CheckInTick({ size = 28 }: { size?: number }) {
  return (
    <IconFrame size={size}>
      <InkCircle cx="24" cy="24" r="20" $fill="highlight" />
      <InkPath d="M14 25 L21 32 L34 16" />
    </IconFrame>
  );
}
