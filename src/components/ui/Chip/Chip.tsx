"use client";

import { ChipButton, ChipTag, type ChipTone } from "./Chip.style";

type ChipProps = {
  label: string;
  tone?: ChipTone;
  /** When set, the chip is a toggle button. Otherwise it is a plain label. */
  onToggle?: () => void;
  selected?: boolean;
};

// A small pill: a plain label (for example a confidence label) or a toggle (for example a quick choice).
export function Chip({ label, tone = "default", onToggle, selected = false }: ChipProps) {
  if (onToggle) {
    return (
      <ChipButton
        type="button"
        aria-pressed={selected}
        $tone={tone}
        $selected={selected}
        onClick={onToggle}
      >
        {label}
      </ChipButton>
    );
  }
  return <ChipTag $tone={tone}>{label}</ChipTag>;
}
