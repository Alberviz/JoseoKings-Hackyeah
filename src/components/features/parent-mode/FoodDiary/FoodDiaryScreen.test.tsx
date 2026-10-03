import { fireEvent, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { DISCOMFORT_THRESHOLD, MISSION_IDS, QUESTION_IDS } from "@/config/content-ids";
import { sessionStore } from "@/hooks/useParentSession";
import { todayKey } from "@/lib/dates";
import { buildDemoState } from "@/lib/demo-data";
import { createPinRecord } from "@/lib/pin";
import { saveState } from "@/lib/storage";
import { renderWithTheme } from "@/test/renderWithTheme";
import type { AppState, CheckIn } from "@/types";
import { FoodDiaryScreen } from "./FoodDiaryScreen";

function ProviderWrapper({ children }: { children: ReactNode }) {
  return <AppStateProvider>{children}</AppStateProvider>;
}

describe("FoodDiaryScreen (Task T13)", () => {
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

  it("shows PinGate setup needed if child profile or PIN is missing", async () => {
    renderWithTheme(
      <ProviderWrapper>
        <FoodDiaryScreen />
      </ProviderWrapper>,
    );

    expect(await screen.findByRole("heading", { name: "Setup needed" })).toBeDefined();
    expect(
      screen.getByText("Parent mode requires a child profile and a 4-digit PIN."),
    ).toBeDefined();
  });

  it("shows PinGate unlock prompt when session is locked", async () => {
    const pinRecord = await createPinRecord("1234");
    const state: AppState = {
      ...buildDemoState(),
      child: { nickname: "Lucas" },
      settings: {
        ...pinRecord,
        allowedMissionIds: Object.values(MISSION_IDS),
      },
    };
    saveState(state);

    renderWithTheme(
      <ProviderWrapper>
        <FoodDiaryScreen />
      </ProviderWrapper>,
    );

    expect(await screen.findByRole("heading", { name: "Parent food diary" })).toBeDefined();
    expect(screen.getByLabelText("4-digit PIN")).toBeDefined();
  });

  it("renders empty state and allows adding a food entry", async () => {
    const pinRecord = await createPinRecord("1234");
    const today = todayKey();
    const state: AppState = {
      ...buildDemoState(),
      child: { nickname: "Lucas" },
      settings: {
        ...pinRecord,
        allowedMissionIds: Object.values(MISSION_IDS),
      },
      foodEntries: [],
    };
    saveState(state);
    sessionStore.setUnlocked(true);

    renderWithTheme(
      <ProviderWrapper>
        <FoodDiaryScreen />
      </ProviderWrapper>,
    );

    expect(await screen.findByRole("heading", { name: "Food diary" })).toBeDefined();
    expect(
      screen.getByText(/No food entries recorded yet\. You can use this diary/i),
    ).toBeDefined();

    // Fill form
    const textarea = screen.getByLabelText("What was eaten?");
    fireEvent.change(textarea, {
      target: { value: "Oatmeal with banana and honey" },
    });

    const submitBtn = screen.getByRole("button", { name: "Save food entry" });
    fireEvent.click(submitBtn);

    expect(await screen.findByText("Food entry saved.")).toBeDefined();
    expect(screen.getByText("Oatmeal with banana and honey")).toBeDefined();
    expect(screen.getByText(today)).toBeDefined();
  });

  it("links food entry to check-in when discomfort was marked on that date", async () => {
    const pinRecord = await createPinRecord("1234");
    const today = todayKey();
    const discomfortCheckIn: CheckIn = {
      id: "checkin-discomfort-1",
      date: today,
      notToday: false,
      answers: {
        [QUESTION_IDS.bellyComfort]: DISCOMFORT_THRESHOLD,
        [QUESTION_IDS.energy]: 1,
        [QUESTION_IDS.playPace]: 0,
      },
      createdAt: `${today}T10:00:00.000Z`,
    };

    const state: AppState = {
      ...buildDemoState(),
      child: { nickname: "Lucas" },
      settings: {
        ...pinRecord,
        allowedMissionIds: Object.values(MISSION_IDS),
      },
      checkIns: [discomfortCheckIn],
      foodEntries: [],
    };
    saveState(state);
    sessionStore.setUnlocked(true);

    renderWithTheme(
      <ProviderWrapper>
        <FoodDiaryScreen />
      </ProviderWrapper>,
    );

    // Displays reactive prompt banner for today's discomfort
    expect(
      await screen.findByRole("heading", { name: "Want to note what Lucas ate today?" }),
    ).toBeDefined();
    expect(
      screen.getByText("Lucas marked discomfort on this day (entry will link to this check-in)."),
    ).toBeDefined();

    // Add entry
    const textarea = screen.getByLabelText("What was eaten?");
    fireEvent.change(textarea, { target: { value: "Creamy cheese pasta" } });
    fireEvent.click(screen.getByRole("button", { name: "Save food entry" }));

    // Appears in list with link badge
    expect(await screen.findByText("Creamy cheese pasta")).toBeDefined();
    expect(screen.getByText("Linked to discomfort day")).toBeDefined();
  });

  it("validates empty submission", async () => {
    const pinRecord = await createPinRecord("1234");
    const state: AppState = {
      ...buildDemoState(),
      child: { nickname: "Lucas" },
      settings: {
        ...pinRecord,
        allowedMissionIds: Object.values(MISSION_IDS),
      },
    };
    saveState(state);
    sessionStore.setUnlocked(true);

    renderWithTheme(
      <ProviderWrapper>
        <FoodDiaryScreen />
      </ProviderWrapper>,
    );

    await screen.findByRole("heading", { name: "Food diary" });

    fireEvent.click(screen.getByRole("button", { name: "Save food entry" }));

    expect(await screen.findByText("Please enter what was eaten.")).toBeDefined();
  });
});
