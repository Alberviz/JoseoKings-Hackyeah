import { describe, expect, it } from "vitest";
import { useEffect } from "react";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { useAppState } from "@/hooks/useAppState";
import { buildDemoState } from "@/lib/demo-data";
import { renderWithTheme } from "@/test/renderWithTheme";
import { PatternsScreen } from "./PatternsScreen";

function DemoLoader({ children }: { children: React.ReactNode }) {
  const { actions, isReady } = useAppState();

  useEffect(() => {
    if (isReady) {
      actions.loadDemo(buildDemoState());
    }
  }, [actions, isReady]);

  return <>{children}</>;
}

describe("PatternsScreen", () => {
  it("renders empty state when there are fewer than 14 days of check-ins", () => {
    const { getByText } = renderWithTheme(
      <AppStateProvider>
        <PatternsScreen />
      </AppStateProvider>,
    );

    expect(getByText(/Patterns & Trends/i)).toBeDefined();
    expect(getByText(/Not enough data yet/i)).toBeDefined();
    expect(getByText(/Go to Parent Settings/i)).toBeDefined();
  });

  it("renders full patterns, calendar, weekly trends and disclaimers with demo data", async () => {
    const { findByText } = renderWithTheme(
      <AppStateProvider>
        <DemoLoader>
          <PatternsScreen />
        </DemoLoader>
      </AppStateProvider>,
    );

    expect(await findByText(/Daily Well-Being Calendar/i)).toBeDefined();
    expect(await findByText(/Weekly Trends/i)).toBeDefined();
    expect(await findByText(/Logged Foods on Days with Discomfort/i)).toBeDefined();
    expect(await findByText(/Important Notice/i)).toBeDefined();
  });
});
