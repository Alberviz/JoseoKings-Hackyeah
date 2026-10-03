import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useEffect } from "react";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { sessionStore } from "@/hooks/useParentSession";
import { useAppState } from "@/hooks/useAppState";
import { buildDemoState } from "@/lib/demo-data";
import { createPinRecord } from "@/lib/pin";
import { renderWithTheme } from "@/test/renderWithTheme";
import DoctorReportPage from "./page";

function DemoLoader({ children }: { children: React.ReactNode }) {
  const { actions, isReady } = useAppState();

  useEffect(() => {
    if (isReady) {
      createPinRecord("1234").then((pinRecord) => {
        const demo = buildDemoState({
          settings: {
            ...pinRecord,
            allowedMissionIds: ["move-1", "move-2"],
          },
        });
        actions.loadDemo(demo);
      });
    }
  }, [actions, isReady]);

  return <>{children}</>;
}

describe("DoctorReportPage", () => {
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

  it("shows setup PinGate when child profile is not set up", async () => {
    const { findByText } = renderWithTheme(
      <AppStateProvider>
        <DoctorReportPage />
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
          <DoctorReportPage />
        </DemoLoader>
      </AppStateProvider>,
    );

    expect(await findByRole("heading", { name: "Doctor report" })).toBeDefined();
    expect(await findByRole("button", { name: "Unlock" })).toBeDefined();
  });

  it("renders full consultation summary report when unlocked", async () => {
    sessionStore.setUnlocked(true);

    const { findByText, findByRole } = renderWithTheme(
      <AppStateProvider>
        <DemoLoader>
          <DoctorReportPage />
        </DemoLoader>
      </AppStateProvider>,
    );

    expect(await findByText("CrohnCare · Consultation Summary")).toBeDefined();
    expect(await findByRole("link", { name: /Back to Parent Mode/i })).toBeDefined();
    expect(await findByRole("button", { name: "Save as PDF / Print" })).toBeDefined();
  });
});
