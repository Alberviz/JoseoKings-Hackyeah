"use client";

import type { ReactNode } from "react";
import { StyledHeading, type HeadingLevel } from "./Heading.style";

type HeadingProps = {
  children: ReactNode;
  level?: HeadingLevel;
};

export function Heading({ children, level = 1 }: HeadingProps) {
  return (
    <StyledHeading as={`h${level}`} $level={level}>
      {children}
    </StyledHeading>
  );
}
