"use client";

import type { ReactNode } from "react";
import type { ButtonVariant } from "../Button/Button.style";
import { StyledLinkButton } from "./LinkButton.style";

type LinkButtonProps = {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

// Navigation that looks like a button. Use Button for actions, LinkButton for going somewhere.
export function LinkButton({
  href,
  children,
  variant = "primary",
  fullWidth = false,
}: LinkButtonProps) {
  return (
    <StyledLinkButton href={href} $variant={variant} $fullWidth={fullWidth}>
      {children}
    </StyledLinkButton>
  );
}
