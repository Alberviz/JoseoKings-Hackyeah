"use client";

import type { ReactNode } from "react";
import type { AppTheme } from "@/theme/theme";
import { OptionIcon, OptionLabel, StyledOptionButton } from "./OptionButton.style";

type OptionButtonProps = {
  /** Always provided: read by screen readers and shown under the drawing. */
  label: string;
  /** Optional drawing (an emoji or an SVG element). Hidden from screen readers. */
  icon?: ReactNode;
  selected?: boolean;
  /** Parent-area section whose colour marks the selected option. Default: yellow highlight. */
  section?: keyof AppTheme["sections"];
  disabled?: boolean;
  onSelect: () => void;
};

// A large toggle button for choices on drawings, for example the check-in answers.
export function OptionButton({
  label,
  icon,
  selected = false,
  section,
  disabled = false,
  onSelect,
}: OptionButtonProps) {
  return (
    <StyledOptionButton
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      $selected={selected}
      $section={section}
      onClick={onSelect}
    >
      {icon ? <OptionIcon aria-hidden="true">{icon}</OptionIcon> : null}
      <OptionLabel>{label}</OptionLabel>
    </StyledOptionButton>
  );
}
