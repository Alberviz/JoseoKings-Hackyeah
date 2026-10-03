"use client";

import type { ReactNode } from "react";
import { IconSvg, InkCircle, InkEllipse, InkPath, InkRect } from "./CheckInIcons.style";

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

// Round, friendly belly faces: happy smile, wobbly mouth with a tummy swirl, tired face with a hand on the tummy.
function BellyFace({ mood }: { mood: "calm" | "rumble" | "sore" }) {
  const fill = mood === "calm" ? "highlight" : mood === "rumble" ? "primarySoft" : "lavender";
  return (
    <>
      <InkCircle cx="24" cy="24" r="18" $fill={fill} />
      <InkCircle cx="12.5" cy="28" r="2.6" $fill="accent" />
      <InkCircle cx="35.5" cy="28" r="2.6" $fill="accent" />
      {mood === "calm" ? (
        <>
          <InkCircle cx="17.5" cy="21" r="2" $solid />
          <InkCircle cx="30.5" cy="21" r="2" $solid />
          <InkPath d="M16 28 Q24 37 32 28" $fill="surface" />
        </>
      ) : null}
      {mood === "rumble" ? (
        <>
          <InkCircle cx="17.5" cy="21" r="2" $solid />
          <InkCircle cx="30.5" cy="21" r="2" $solid />
          <InkPath d="M17 32 Q20.5 28 24 32 T31 32" />
          <InkPath d="M22 41 C18 41 18 46 23 46 C27 46 27 42 24 42" />
        </>
      ) : null}
      {mood === "sore" ? (
        <>
          <InkPath d="M14.5 21 Q17.5 24 20.5 21" />
          <InkPath d="M27.5 21 Q30.5 24 33.5 21" />
          <InkPath d="M18 32 Q21 30 24 32 T30 32" />
          <InkEllipse cx="24" cy="44" rx="9" ry="4.5" $fill="accent" />
        </>
      ) : null}
    </>
  );
}

// Friendly batteries: 3, 2 or 1 bars lit. Empty bars stay light.
function EnergyBattery({ lit }: { lit: 1 | 2 | 3 }) {
  const barFill = lit === 3 ? "success" : lit === 2 ? "highlight" : "accent";
  return (
    <>
      <InkRect x="4" y="9" width="36" height="30" rx="8" $fill="surface" />
      <InkRect x="40" y="19" width="5" height="10" rx="2" $fill="surface" />
      {[0, 1, 2].map((slot) => (
        <InkRect
          key={slot}
          x={8 + slot * 10.5}
          y="13"
          width="8"
          height="12"
          rx="2.5"
          $fill={slot < lit ? barFill : "paper"}
        />
      ))}
      <InkPath d="M15 31 Q22 36 29 31" />
    </>
  );
}

// Simple figures: running, walking with little pauses, resting.
function PlayFigure({ pace }: { pace: "active" | "breaks" | "resting" }) {
  if (pace === "active") {
    return (
      <>
        <InkEllipse cx="25" cy="22" rx="4" ry="8" $fill="accent" />
        <InkCircle cx="29" cy="9" r="5" $fill="highlight" />
        <InkPath d="M27 15 L22 28" $fill="primarySoft" />
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
        <InkEllipse cx="19" cy="23" rx="4" ry="8" $fill="mint" />
        <InkPath d="M19 15 L19 29" />
        <InkPath d="M19 18 L13 25 M19 18 L25 24" />
        <InkPath d="M19 29 L14 43 M19 29 L25 43" />
        <InkRect x="33" y="14" width="4" height="14" rx="1.5" $fill="accent" />
        <InkRect x="40" y="14" width="4" height="14" rx="1.5" $fill="accent" />
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
  "energy-high": <EnergyBattery lit={3} />,
  "energy-medium": <EnergyBattery lit={2} />,
  "energy-low": <EnergyBattery lit={1} />,
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
