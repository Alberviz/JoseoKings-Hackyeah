"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import type { ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { GlobalStyle } from "@/theme/GlobalStyle.style";
import { theme } from "@/theme/theme";
import { StyledComponentsRegistry } from "../StyledComponentsRegistry/StyledComponentsRegistry";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <StyledComponentsRegistry>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>
      </ThemeProvider>
    </StyledComponentsRegistry>
  );
}
