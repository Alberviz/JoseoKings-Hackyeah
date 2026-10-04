"use client";

import {
  IconSvg,
  InkCircle,
  InkPath,
  InkRect,
} from "../../child-mode/CheckInIcons/CheckInIcons.style";
import { LockBody, LockShackle } from "./AnimatedLock.style";

type AnimatedLockProps = {
  locking: boolean;
  size?: number;
};

// Drawn padlock for the Exit sheet. Decorative: the button label says what it does.
export function AnimatedLock({ locking, size = 44 }: AnimatedLockProps) {
  return (
    <IconSvg $size={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <LockShackle $locking={locking}>
        <InkPath d="M15 22 V15 C15 6 33 6 33 15 V22" />
      </LockShackle>
      <LockBody $locking={locking}>
        <InkRect x="9" y="21" width="30" height="22" rx="5" $fill="highlight" />
        <InkCircle cx="24" cy="30" r="3" $solid />
        <InkPath d="M24 32 V37" />
      </LockBody>
    </IconSvg>
  );
}
