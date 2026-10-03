"use client";

import type { ReactNode } from "react";
import { ScreenContainer } from "./Screen.style";

type ScreenProps = {
  children: ReactNode;
};

// Root container of every page. Renders the <main> landmark.
export function Screen({ children }: ScreenProps) {
  return <ScreenContainer>{children}</ScreenContainer>;
}
