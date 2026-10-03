"use client";

import type { ReactNode } from "react";
import { StackContainer, type StackAlign, type StackDirection, type StackGap } from "./Stack.style";

type StackProps = {
  children: ReactNode;
  gap?: StackGap;
  direction?: StackDirection;
  align?: StackAlign;
};

// Layout primitive: lays out children in a row or column with a theme spacing gap.
export function Stack({
  children,
  gap = "md",
  direction = "column",
  align = "stretch",
}: StackProps) {
  return (
    <StackContainer $gap={gap} $direction={direction} $align={align}>
      {children}
    </StackContainer>
  );
}
