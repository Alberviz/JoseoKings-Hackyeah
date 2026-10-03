"use client";

import type { ReactNode } from "react";
import { GroupLegend, OptionGrid, StyledFieldset } from "./OptionGroup.style";

type OptionGroupProps = {
  /** The question. Always read by screen readers; shown unless `hideLegend` is set. */
  legend: string;
  hideLegend?: boolean;
  columns?: 2 | 3;
  children: ReactNode;
};

// Groups OptionButtons under one question, with the right semantics for assistive technology.
export function OptionGroup({
  legend,
  hideLegend = false,
  columns = 2,
  children,
}: OptionGroupProps) {
  return (
    <StyledFieldset>
      <GroupLegend $hidden={hideLegend}>{legend}</GroupLegend>
      <OptionGrid $columns={columns}>{children}</OptionGrid>
    </StyledFieldset>
  );
}
