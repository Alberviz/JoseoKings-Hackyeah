import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { ROUTES } from "@/config/app";
import { MISSION_IDS } from "@/config/content-ids";
import { MISSION_STOP_MESSAGE } from "@/content/disclaimers";
import { createPinRecord } from "@/lib/pin";
import { createEmptyState, loadState, saveState } from "@/lib/storage";
import { theme } from "@/theme/theme";
import type { AppState } from "@/types";
import { MissionListScreen } from "./MissionListScreen/MissionListScreen";
import { MissionRunScreen } from "./MissionRunScreen/MissionRunScreen";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
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

async function setupTestState(overrides?: Partial<AppState>) {
  const pinRecord = await createPinRecord("1234");
  const base = createEmptyState();
  const state: AppState = {
    ...base,
    child: { nickname: "Lucas" },
    settings: {
      pinHash: pinRecord.pinHash,
      pinSalt: pinRecord.pinSalt,
      allowedMissionIds: [MISSION_IDS.dragonBreathing, MISSION_IDS.bedStretch],
    },
    ...overrides,
  };
  saveState(state);
  return state;
}

describe("Missions Feature (Task T8)", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("MissionListScreen", () => {
    it("redirects to parentSetup when no child profile exists", async () => {
      const base = createEmptyState();
      saveState({ ...base, child: null });

      render(
        <ProviderWrapper>
          <MissionListScreen />
        </ProviderWrapper>,
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(ROUTES.parentSetup);
      });
    });

    it("shows only allowed missions in the list", async () => {
      await setupTestState({
        settings: {
          pinHash: "hash",
          pinSalt: "salt",
          allowedMissionIds: [MISSION_IDS.dragonBreathing],
        },
      });

      render(
        <ProviderWrapper>
          <MissionListScreen />
        </ProviderWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Dragon Breathing")).toBeDefined();
      });
      expect(screen.queryByText("Bed Stretch")).toBeNull();
      expect(screen.queryByText("Flamingo Balance")).toBeNull();
      expect(screen.getByRole("img", { name: /lucas/i })).toBeDefined();
    });

    it("displays an empty state message when no missions are allowed", async () => {
      await setupTestState({
        settings: {
          pinHash: "hash",
          pinSalt: "salt",
          allowedMissionIds: [],
        },
      });

      render(
        <ProviderWrapper>
          <MissionListScreen />
        </ProviderWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Ask a parent to enable missions")).toBeDefined();
      });
      expect(screen.getByRole("link", { name: "Back to home" })).toBeDefined();
    });
  });

  describe("MissionRunScreen - Flow and Rules", () => {
    it("displays unavailable message for unknown or unallowed mission id", async () => {
      await setupTestState();

      render(
        <ProviderWrapper>
          <MissionRunScreen missionId="unknown-id" />
        </ProviderWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Mission Not Available")).toBeDefined();
      });
      expect(screen.getByRole("link", { name: "Choose another mission" })).toBeDefined();
    });

    it("navigates company choice, ready step, and back", async () => {
      await setupTestState();

      render(
        <ProviderWrapper>
          <MissionRunScreen missionId={MISSION_IDS.dragonBreathing} />
        </ProviderWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Dragon Breathing")).toBeDefined();
      });
      expect(screen.getByRole("button", { name: /on my own/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /with my family/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /with someone else/i })).toBeDefined();

      // Pick "On my own" -> moves to ready step
      fireEvent.click(screen.getByRole("button", { name: /on my own/i }));
      expect(screen.getByText("Ready to begin?")).toBeDefined();
      expect(screen.getByRole("button", { name: "Start mission" })).toBeDefined();

      // Pick "Change companion" -> goes back to company choices
      fireEvent.click(screen.getByRole("button", { name: "Change companion" }));
      expect(screen.getByRole("button", { name: /on my own/i })).toBeDefined();
    });

    it("advances with time and shows 'I did it' button ONLY after timer ends for alone missions", async () => {
      await setupTestState();

      render(
        <ProviderWrapper>
          <MissionRunScreen missionId={MISSION_IDS.dragonBreathing} />
        </ProviderWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Dragon Breathing")).toBeDefined();
      });

      // Switch to fake timers to step through running duration
      vi.useFakeTimers();

      // Select alone
      fireEvent.click(screen.getByRole("button", { name: /on my own/i }));
      // Start mission
      fireEvent.click(screen.getByRole("button", { name: "Start mission" }));

      // Step 1 is displayed
      expect(
        screen.getByText("Sit comfortably and breathe in slowly through your nose."),
      ).toBeDefined();
      expect(screen.getByRole("button", { name: "Stop" })).toBeDefined();

      // Completion button must NOT exist while running
      expect(screen.queryByRole("button", { name: "I did it" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Confirm" })).toBeNull();

      // Advance by 16 seconds -> Step 2
      act(() => {
        vi.advanceTimersByTime(16000);
      });
      expect(screen.getByText("Gently breathe out like a dragon warming up.")).toBeDefined();
      expect(screen.queryByRole("button", { name: "I did it" })).toBeNull();

      // Advance through remaining steps (75s total)
      act(() => {
        vi.advanceTimersByTime(60000);
      });

      // Restore real timers for interactive confirmation
      vi.useRealTimers();

      // Now finished phase: "I did it" button appears
      expect(await screen.findByRole("button", { name: "I did it" })).toBeDefined();

      // Click "I did it"
      fireEvent.click(screen.getByRole("button", { name: "I did it" }));

      // Result screen
      expect(await screen.findByText("Nice work!")).toBeDefined();
      expect(screen.getByText("Done on their own")).toBeDefined();
      expect(screen.getByRole("link", { name: "More missions" })).toBeDefined();

      // Exactly 1 completed log saved
      const saved = loadState().missionLogs;
      expect(saved).toHaveLength(1);
      expect(saved[0].status).toBe("completed");
      expect(saved[0].company).toBe("alone");
      expect(saved[0].confirmedBy).toBe("child");
    });

    it("stopping early saves a rest log with confirmedBy child and displays stop message", async () => {
      await setupTestState();

      render(
        <ProviderWrapper>
          <MissionRunScreen missionId={MISSION_IDS.dragonBreathing} />
        </ProviderWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Dragon Breathing")).toBeDefined();
      });

      vi.useFakeTimers();

      // Select family
      fireEvent.click(screen.getByRole("button", { name: /with my family/i }));
      fireEvent.click(screen.getByRole("button", { name: "Start mission" }));

      // Run 5 seconds then click Stop
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      vi.useRealTimers();

      fireEvent.click(screen.getByRole("button", { name: "Stop" }));

      // Result screen for rest
      expect(await screen.findByText("Rest time")).toBeDefined();
      expect(screen.getByText(MISSION_STOP_MESSAGE)).toBeDefined();
      expect(screen.getByText("Done with family")).toBeDefined();

      // Saved as rest log once
      const saved = loadState().missionLogs;
      expect(saved).toHaveLength(1);
      expect(saved[0].status).toBe("rest");
      expect(saved[0].company).toBe("family");
      expect(saved[0].confirmedBy).toBe("child");
    });

    it("family mission rejects wrong PIN and accepts correct PIN to save log once", async () => {
      await setupTestState();

      render(
        <ProviderWrapper>
          <MissionRunScreen missionId={MISSION_IDS.dragonBreathing} />
        </ProviderWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Dragon Breathing")).toBeDefined();
      });

      vi.useFakeTimers();

      // Choose family
      fireEvent.click(screen.getByRole("button", { name: /with my family/i }));
      fireEvent.click(screen.getByRole("button", { name: "Start mission" }));

      // Run to the end (75s)
      act(() => {
        vi.advanceTimersByTime(75000);
      });
      vi.useRealTimers();

      // Verification form
      expect(await screen.findByText("Done with family!")).toBeDefined();
      const pinInput = screen.getByLabelText(/parent 4-digit pin/i);
      const submitButton = screen.getByRole("button", { name: "Confirm PIN" });

      // Wrong PIN
      fireEvent.change(pinInput, { target: { value: "9999" } });
      fireEvent.click(submitButton);

      expect(
        await screen.findByText("Incorrect PIN. Please try again.", {}, { timeout: 5000 }),
      ).toBeDefined();
      expect(loadState().missionLogs).toHaveLength(0);

      // Correct PIN: 1234
      fireEvent.change(pinInput, { target: { value: "1234" } });
      fireEvent.click(submitButton);

      expect(await screen.findByText("Nice work!", {}, { timeout: 5000 })).toBeDefined();
      expect(screen.getByText("You both did it together!")).toBeDefined();
      expect(screen.getByText("Done with family")).toBeDefined();

      // Saved once
      await waitFor(
        () => {
          const saved = loadState().missionLogs;
          expect(saved).toHaveLength(1);
          expect(saved[0].status).toBe("completed");
          expect(saved[0].company).toBe("family");
          expect(saved[0].confirmedBy).toBe("parent-pin");
        },
        { timeout: 5000 },
      );
    });

    it("other company mission allows other-tap confirmation with cooperative copy", async () => {
      await setupTestState();

      render(
        <ProviderWrapper>
          <MissionRunScreen missionId={MISSION_IDS.dragonBreathing} />
        </ProviderWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Dragon Breathing")).toBeDefined();
      });

      vi.useFakeTimers();

      // Choose other
      fireEvent.click(screen.getByRole("button", { name: /with someone else/i }));
      fireEvent.click(screen.getByRole("button", { name: "Start mission" }));

      // Run to end
      act(() => {
        vi.advanceTimersByTime(75000);
      });
      vi.useRealTimers();

      expect(await screen.findByText("Great teamwork!")).toBeDefined();
      const confirmButton = screen.getByRole("button", { name: "Confirm" });

      fireEvent.click(confirmButton);

      expect(await screen.findByText("Nice work!")).toBeDefined();
      expect(screen.getByText("You both did it together!")).toBeDefined();
      expect(screen.getByText("Done with someone")).toBeDefined();

      const saved = loadState().missionLogs;
      expect(saved).toHaveLength(1);
      expect(saved[0].status).toBe("completed");
      expect(saved[0].company).toBe("other");
      expect(saved[0].confirmedBy).toBe("other-tap");
    });

    it("locks out parent PIN entry after 5 failed attempts", async () => {
      await setupTestState();

      render(
        <ProviderWrapper>
          <MissionRunScreen missionId={MISSION_IDS.dragonBreathing} />
        </ProviderWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Dragon Breathing")).toBeDefined();
      });

      vi.useFakeTimers();
      fireEvent.click(screen.getByRole("button", { name: /with my family/i }));
      fireEvent.click(screen.getByRole("button", { name: "Start mission" }));

      act(() => {
        vi.advanceTimersByTime(75000);
      });
      vi.useRealTimers();

      expect(await screen.findByText("Done with family!")).toBeDefined();
      const pinInput = screen.getByLabelText(/parent 4-digit pin/i);
      const submitButton = screen.getByRole("button", { name: "Confirm PIN" });

      for (let i = 0; i < 5; i += 1) {
        fireEvent.change(pinInput, { target: { value: "0000" } });
        fireEvent.click(submitButton);
        await screen.findByText("Incorrect PIN. Please try again.");
      }

      // After 5 attempts, lockout alert should appear
      expect(
        await screen.findByText(/Too many failed attempts. Locked for \d+ seconds\./),
      ).toBeDefined();
      expect((submitButton as HTMLButtonElement).disabled).toBe(true);
      expect(loadState().missionLogs).toHaveLength(0);
    });

    it("saves the log strictly once on stop and ignores repeated actions", async () => {
      await setupTestState();

      const { rerender } = render(
        <ProviderWrapper>
          <MissionRunScreen missionId={MISSION_IDS.dragonBreathing} />
        </ProviderWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Dragon Breathing")).toBeDefined();
      });

      vi.useFakeTimers();
      fireEvent.click(screen.getByRole("button", { name: /on my own/i }));
      fireEvent.click(screen.getByRole("button", { name: "Start mission" }));

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      vi.useRealTimers();

      fireEvent.click(screen.getByRole("button", { name: "Stop" }));

      expect(await screen.findByText("Rest time")).toBeDefined();
      expect(loadState().missionLogs).toHaveLength(1);

      // Re-render multiple times
      rerender(
        <ProviderWrapper>
          <MissionRunScreen missionId={MISSION_IDS.dragonBreathing} />
        </ProviderWrapper>,
      );

      expect(loadState().missionLogs).toHaveLength(1);
    });
  });
});
