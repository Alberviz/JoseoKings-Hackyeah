"use client";

import type { ReactNode } from "react";
import {
  IconSvg,
  InkCircle,
  InkPath,
  InkRect,
} from "@/components/features/child-mode/CheckInIcons/CheckInIcons.style";

export type HomeIconKey =
  "flame" | "coin" | "lock" | "smile" | "check" | "chevron" | "play" | "shop" | "food" | "dress";

type HomeIconProps = {
  iconKey: HomeIconKey;
  size?: number;
};

// Hand-drawn icons for the child home. They are decorative: a visible label always sits next to them.
const DRAWINGS: Record<HomeIconKey, ReactNode> = {
  flame: (
    <>
      <InkPath
        d="M24 4 C26 12 37 17 37 30 C37 39 31 44 24 44 C17 44 11 39 11 30 C11 24 14 20 17 17 C17 21 19 23 21 23 C21 16 21 10 24 4 Z"
        $fill="accent"
      />
      <InkPath
        d="M24 41 C20 41 18 38 18 34 C18 30 21 28 23 25 C25 28 30 30 30 35 C30 39 28 41 24 41 Z"
        $fill="highlight"
      />
    </>
  ),
  coin: (
    <>
      <InkCircle cx="24" cy="24" r="19" $fill="highlight" />
      <InkCircle cx="24" cy="24" r="11" />
      <InkPath d="M24 18 V30" />
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
  smile: (
    <>
      <InkCircle cx="24" cy="24" r="18" $fill="highlight" />
      <InkCircle cx="12.5" cy="28" r="2.6" $fill="accent" />
      <InkCircle cx="35.5" cy="28" r="2.6" $fill="accent" />
      <InkCircle cx="17.5" cy="21" r="2" $solid />
      <InkCircle cx="30.5" cy="21" r="2" $solid />
      <InkPath d="M16 28 Q24 37 32 28" $fill="surface" />
    </>
  ),
  check: (
    <>
      <InkCircle cx="24" cy="24" r="18" $fill="success" />
      <InkPath d="M15 25 L21.5 31.5 L33 18" />
    </>
  ),
  chevron: <InkPath d="M18 10 L32 24 L18 38" />,
  play: <InkPath d="M14 8 L40 24 L14 40 Z" $fill="surface" />,
  shop: (
    <>
      <InkRect x="9" y="22" width="30" height="20" rx="3" $fill="surface" />
      <InkRect x="19" y="29" width="10" height="13" rx="2" $fill="lavender" />
      <InkPath
        d="M6 14 L10 6 H38 L42 14 V18 C42 21 38 22 36 20 C34 22 30 22 28.5 20 C27 22 21 22 19.5 20 C18 22 14 22 12 20 C10 22 6 21 6 18 Z"
        $fill="highlight"
      />
      <InkPath d="M15 6 L13 14 M24 6 V14 M33 6 L35 14" />
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
  dress: (
    <>
      <InkPath
        d="M17 6 L6 12 L10 21 L14 19 V42 H34 V19 L38 21 L42 12 L31 6 C29 10 19 10 17 6 Z"
        $fill="lavender"
      />
      <InkPath d="M20 28 H28" />
    </>
  ),
};

export function HomeIcon({ iconKey, size = 28 }: HomeIconProps) {
  return (
    <IconSvg $size={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      {DRAWINGS[iconKey]}
    </IconSvg>
  );
}
