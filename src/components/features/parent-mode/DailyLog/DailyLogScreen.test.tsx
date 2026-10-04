import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { sessionStore } from "@/hooks/useParentSession";
import { addDays, todayKey } from "@/lib/dates";
import { createDefaultEconomy } from "@/lib/economy";
import { createPinRecord } from "@/lib/pin";
import { saveState, STORAGE_KEY } from "@/lib/storage";
import { renderWithTheme } from "@/test/renderWithTheme";
import { theme } from "@/theme/theme";
import type { AppState } from "@/types";
import { DailyLogScreen } from "./DailyLogScreen";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

function ProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <AppStateProvider>{children}</AppStateProvider>
    </ThemeProvider>
  );
}

async function seedReadyState(): Promise<AppState> {
  const pinRecord = await createPinRecord("1234");
  const state: AppState = {
    schemaVersion: 1,
    isDemo: false,
    child: { nickname: "Lucas" },
    settings: {
      ...pinRecord,
    },
    companion: {
      name: "Hero",
      points: 0,
      teamStars: 0,
      ownedItemIds: [],
      equippedItemIds: [],
      badgeIds: [],
    },
    economy: createDefaultEconomy(),
    checkIns: [],
    missionLogs: [],
    parentLogs: [],
    foodEntries: [],
    consultations: [],
  };
  saveState(state);
  return state;
}

describe("DailyLogScreen (T12)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    sessionStore.resetForTesting();
    mockReplace.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    sessionStore.resetForTesting();
  });

  it("shows the PIN gate when locked", async () => {
    await seedReadyState();

    renderWithTheme(
      <ProviderWrapper>
        <DailyLogScreen />
      </ProviderWrapper>,
    );

    expect(await screen.findByLabelText("4-digit PIN")).toBeTruthy();
  });

  it("saves a daily log and a consultation date", async () => {
    await seedReadyState();
    sessionStore.setUnlocked(true);

    renderWithTheme(
      <ProviderWrapper>
        <DailyLogScreen />
      </ProviderWrapper>,
    );

    await screen.findByRole("heading", { name: "Daily log" });
    expect(screen.getByText("Facts for Lucas. No drug names or doses.")).toBeTruthy();

    const sleepSlider = screen.getByLabelText("Sleep hours");
    expect(sleepSlider).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "9h" }));
    expect(screen.getByText("9 hrs")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Increase sleep by 30 minutes" }));
    expect(screen.getByText("9.5 hrs")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Decrease sleep by 30 minutes" }));
    expect(screen.getByText("9 hrs")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Light" }));
    fireEvent.click(screen.getByRole("button", { name: "Went" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));

    // Bathroom observations
    expect(screen.getByRole("heading", { name: "Bathroom observations" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "1–2 (Typical)" }));
    const nightGroup = screen.getByRole("group", { name: "Woke up at night to go?" });
    fireEvent.click(within(nightGroup).getByRole("button", { name: "No" }));
    fireEvent.click(screen.getByRole("button", { name: "Formed / Normal" }));
    fireEvent.click(screen.getByRole("button", { name: "No blood" }));

    fireEvent.change(screen.getByLabelText("Note"), {
      target: { value: "Felt okay after school." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save day" }));

    expect(await screen.findByText("Daily log saved.")).toBeTruthy();

    await waitFor(
      () => {
        const raw = localStorage.getItem(STORAGE_KEY);
        expect(raw).toBeTruthy();
        const parsed = JSON.parse(raw as string) as AppState;
        const log = parsed.parentLogs.find((item) => item.date === todayKey());
        expect(log).toMatchObject({
          sleepHours: 9,
          activity: "light",
          school: "attended",
          medicationTaken: "yes",
          stoolFrequency: "typical",
          stoolNight: "no",
          stoolConsistency: "formed",
          stoolBlood: "none",
          note: "Felt okay after school.",
        });
      },
      { timeout: 5000 },
    );

    fireEvent.change(screen.getByLabelText("Consultation date"), {
      target: { value: "2026-09-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add consultation date" }));

    expect(await screen.findByText("Consultation date added.")).toBeTruthy();
    expect(screen.getByText("2026-09-01")).toBeTruthy();

    await waitFor(
      () => {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = JSON.parse(raw as string) as AppState;
        expect(parsed.consultations.some((item) => item.date === "2026-09-01")).toBe(true);
      },
      { timeout: 5000 },
    );
  }, 15000);

  it("allows selecting 'Don't know' for bathroom observations or omitting them", async () => {
    await seedReadyState();
    sessionStore.setUnlocked(true);

    renderWithTheme(
      <ProviderWrapper>
        <DailyLogScreen />
      </ProviderWrapper>,
    );

    await screen.findByRole("heading", { name: "Daily log" });

    // Click "Don't know" buttons across all bathroom groups
    const dontKnowButtons = screen.getAllByRole("button", { name: "Don't know" });
    expect(dontKnowButtons.length).toBe(4);
    for (const btn of dontKnowButtons) {
      fireEvent.click(btn);
    }

    fireEvent.click(screen.getByRole("button", { name: "Save day" }));
    expect(await screen.findByText("Daily log saved.")).toBeTruthy();

    await waitFor(() => {
      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw as string) as AppState;
      const log = parsed.parentLogs.find((item) => item.date === todayKey());
      expect(log).toMatchObject({
        stoolFrequency: "unknown",
        stoolNight: "unknown",
        stoolConsistency: "unknown",
        stoolBlood: "unknown",
      });
    });
  }, 15000);

  it("schedules an upcoming appointment, displays countdown, and allows removal", async () => {
    await seedReadyState();
    sessionStore.setUnlocked(true);

    renderWithTheme(
      <ProviderWrapper>
        <DailyLogScreen />
      </ProviderWrapper>,
    );

    await screen.findByRole("heading", { name: "Daily log" });

    const futureDate = addDays(todayKey(), 7);
    fireEvent.change(screen.getByLabelText("Consultation date"), {
      target: { value: futureDate },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add consultation date" }));

    expect(await screen.findByText("Consultation date added.")).toBeTruthy();
    expect(screen.getByText("Upcoming appointments")).toBeTruthy();
    expect(screen.getByText(futureDate)).toBeTruthy();
    expect(screen.getByText("In 7 days")).toBeTruthy();

    await waitFor(() => {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(raw as string) as AppState;
      expect(parsed.consultations.some((item) => item.date === futureDate)).toBe(true);
    });

    fireEvent.click(screen.getByRole("button", { name: `Remove appointment ${futureDate}` }));
    expect(await screen.findByText("Consultation removed.")).toBeTruthy();
    expect(screen.queryByText(futureDate)).toBeNull();

    await waitFor(() => {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(raw as string) as AppState;
      expect(parsed.consultations.some((item) => item.date === futureDate)).toBe(false);
    });
  }, 15000);
});
