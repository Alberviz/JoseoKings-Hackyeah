import type { ButtonVariant } from "@/components/ui";
import type { AppTheme } from "@/theme/theme";

// Colour by section for the parent area (docs/DESIGN.md section 2).
export type ParentSection = keyof AppTheme["sections"];

// The Button variant that carries each section's main action.
export const SECTION_BUTTON_VARIANT: Record<ParentSection, ButtonVariant> = {
  summary: "primary",
  log: "success",
  food: "accent",
  patterns: "lavender",
  more: "highlight",
};
