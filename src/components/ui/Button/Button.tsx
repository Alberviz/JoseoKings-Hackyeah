"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { StyledButton, type ButtonVariant } from "./Button.style";

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style" | "className"> & {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

export function Button({
  children,
  variant = "primary",
  fullWidth = false,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <StyledButton type={type} $variant={variant} $fullWidth={fullWidth} {...rest}>
      {children}
    </StyledButton>
  );
}
