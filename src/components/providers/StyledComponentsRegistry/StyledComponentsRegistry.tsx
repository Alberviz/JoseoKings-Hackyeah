"use client";

import { useServerInsertedHTML } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";

type StyledComponentsRegistryProps = {
  children: ReactNode;
};

// Collects styles during server rendering so pages arrive styled (no flash of unstyled content).
export function StyledComponentsRegistry({ children }: StyledComponentsRegistryProps) {
  const [styleSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = styleSheet.getStyleElement();
    styleSheet.instance.clearTag();
    return <>{styles}</>;
  });

  if (typeof window !== "undefined") return <>{children}</>;

  return <StyleSheetManager sheet={styleSheet.instance}>{children}</StyleSheetManager>;
}
