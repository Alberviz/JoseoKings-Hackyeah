import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useEffect } from "react";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { sessionStore } from "@/hooks/useParentSession";
import { useAppState } from "@/hooks/useAppState";
import { buildDemoState } from "@/lib/demo-data";
import { createPinRecord } from "@/lib/pin";
import { renderWithTheme } from "@/test/renderWithTheme";
import { PatternsScreen } from "./PatternsScreen";

function DemoLoader({ children }: { children: React.ReactNode }) {
  const { actions, isReady } = useAppState();

  useEffect(() => {
    if (isReady) {
      createPinRecord("1234").then((pinRecord) => {
        const demo = buildDemoState({
          settings: {
            ...pinRecord,
          },
        });
        actions.loadDemo(demo);
        actions.setSettings({
          ...pinRecord,
        });
      });
    }
  }, [actions, isReady]);

  return <>{children}</>;
}

describe("PatternsScreen", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    sessionStore.resetForTesting();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    sessionStore.resetForTesting();
  });

  it("shows PinGate when child profile is not set up", async () => {
    const { findByText } = renderWithTheme(
      <AppStateProvider>
        <PatternsScreen />
      </AppStateProvider>,
    );

    expect(await findByText("Setup needed")).toBeDefined();
    expect(
      await findByText(/Parent mode requires a child profile and a 4-digit PIN/),
    ).toBeDefined();
  });

  it("shows PinGate when session is locked", async () => {
    const { findByRole } = renderWithTheme(
      <AppStateProvider>
        <DemoLoader>
          <PatternsScreen />
        </DemoLoader>
      </AppStateProvider>,
    );

    expect(await findByRole("heading", { name: "Parent patterns" })).toBeDefined();
    expect(await findByRole("button", { name: "Unlock" })).toBeDefined();
  });

  it("renders full patterns, calendar, weekly trends and disclaimers when unlocked with demo data", async () => {
    sessionStore.setUnlocked(true);

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
