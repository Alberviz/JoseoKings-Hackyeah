"use client";

import type { ReactNode } from "react";
import { StyledText, type TextSize, type TextTone } from "./Text.style";

type TextProps = {
  children: ReactNode;
  tone?: TextTone;
  size?: TextSize;
};

export function Text({ children, tone = "default", size = "md" }: TextProps) {
  return (
    <StyledText $tone={tone} $size={size}>
      {children}
    </StyledText>
  );
}
