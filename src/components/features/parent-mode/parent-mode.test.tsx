import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { Button, Stack, Text } from "@/components/ui";
import { ROUTES } from "@/config/app";
import { DISCOMFORT_THRESHOLD, MISSION_IDS, QUESTION_IDS } from "@/config/content-ids";
import { sessionStore, useParentSession } from "@/hooks/useParentSession";
import { addDays, todayKey } from "@/lib/dates";
import { buildDemoState } from "@/lib/demo-data";
import { createPinRecord } from "@/lib/pin";
import { saveState, STORAGE_KEY } from "@/lib/storage";
import { renderWithTheme } from "@/test/renderWithTheme";
import { theme } from "@/theme/theme";
import type { AppState } from "@/types";
import { ParentHomeScreen } from "./ParentHomeScreen/ParentHomeScreen";
import { PinGate } from "./PinGate/PinGate";
import { SettingsScreen } from "./SettingsScreen/SettingsScreen";
import { SetupScreen } from "./SetupScreen/SetupScreen";
import { SummaryCard } from "./SummaryCard/SummaryCard";

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

function SessionConsumer() {
  const { isUnlocked, setUnlocked } = useParentSession();
  return (
    <Stack>
      <Text>{isUnlocked ? "SESSION_UNLOCKED" : "SESSION_LOCKED"}</Text>
      <Button onClick={() => setUnlocked(true)}>Unlock session</Button>
    </Stack>
  );
}

describe("Parent Mode Shell (Task T10)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    sessionStore.resetForTesting();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    sessionStore.resetForTesting();
  });

  describe("SetupScreen validation", () => {
    it("validates short PIN and PIN mismatch and empty nickname", async () => {
      renderWithTheme(
        <ProviderWrapper>
          <SetupScreen />
        </ProviderWrapper>,
      );

      // Wait for isReady
      await screen.findByRole("heading", { name: "Parent mode setup" });

      const submitBtn = screen.getByRole("button", { name: "Complete setup" });

      // 1. Submit with empty nickname
      fireEvent.click(submitBtn);
      expect(await screen.findByText("Please enter a name.")).toBeDefined();

      // Enter nickname
      const nicknameInput = screen.getByLabelText("Child's name");
      fireEvent.change(nicknameInput, { target: { value: "Lucas" } });

      // 2. Submit with short PIN
      const pinInput = screen.getByLabelText("Create 4-digit PIN");
      const confirmPinInput = screen.getByLabelText("Confirm 4-digit PIN");

      fireEvent.change(pinInput, { target: { value: "12" } });
      fireEvent.change(confirmPinInput, { target: { value: "12" } });
      fireEvent.click(submitBtn);

      expect(await screen.findByText("The PIN must be 4 digits.")).toBeDefined();

      // 3. Submit with PIN mismatch
      fireEvent.change(pinInput, { target: { value: "1234" } });
      fireEvent.change(confirmPinInput, { target: { value: "1235" } });
      fireEvent.click(submitBtn);

      expect(await screen.findByText("PINs do not match.")).toBeDefined();
    });

    it("validates that at least one mission must be enabled", async () => {
      renderWithTheme(
        <ProviderWrapper>
          <SetupScreen />
        </ProviderWrapper>,
      );

      await screen.findByRole("heading", { name: "Parent mode setup" });

      const nicknameInput = screen.getByLabelText("Child's name");
      const pinInput = screen.getByLabelText("Create 4-digit PIN");
      const confirmPinInput = screen.getByLabelText("Confirm 4-digit PIN");
      const submitBtn = screen.getByRole("button", { name: "Complete setup" });

      fireEvent.change(nicknameInput, { target: { value: "Lucas" } });
      fireEvent.change(pinInput, { target: { value: "1234" } });
      fireEvent.change(confirmPinInput, { target: { value: "1234" } });

      // Deselect all missions
      const allMissionIds = Object.values(MISSION_IDS);
      for (const id of allMissionIds) {
        const chip = screen.getByRole("button", {
          pressed: true,
          name: new RegExp(id.replace(/-/g, " "), "i"),
        });
        fireEvent.click(chip);
      }

      fireEvent.click(submitBtn);
      expect(await screen.findByText("Choose at least one mission.")).toBeDefined();
    });

    it("submits valid setup, unlocks session and navigates to /parent", async () => {
      renderWithTheme(
        <ProviderWrapper>
          <SetupScreen />
        </ProviderWrapper>,
      );

      await screen.findByRole("heading", { name: "Parent mode setup" });

      fireEvent.change(screen.getByLabelText("Child's name"), { target: { value: "Lucas" } });
      fireEvent.change(screen.getByLabelText("Create 4-digit PIN"), { target: { value: "1234" } });
      fireEvent.change(screen.getByLabelText("Confirm 4-digit PIN"), { target: { value: "1234" } });

      fireEvent.click(screen.getByRole("button", { name: "Complete setup" }));

      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith(ROUTES.parent);
        },
        { timeout: 5000 },
      );
      expect(sessionStore.getSnapshot().isUnlocked).toBe(true);
    });

    it("routes to / when device role is set to child", async () => {
      renderWithTheme(
        <ProviderWrapper>
          <SetupScreen />
        </ProviderWrapper>,
      );

      await screen.findByRole("heading", { name: "Parent mode setup" });

      fireEvent.change(screen.getByLabelText("Child's name"), { target: { value: "Lucas" } });
      fireEvent.click(screen.getByRole("button", { name: "My child" }));
      fireEvent.change(screen.getByLabelText("Create 4-digit PIN"), { target: { value: "1234" } });
      fireEvent.change(screen.getByLabelText("Confirm 4-digit PIN"), { target: { value: "1234" } });

      fireEvent.click(screen.getByRole("button", { name: "Complete setup" }));

      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith(ROUTES.home);
        },
        { timeout: 5000 },
      );
    });

    it("shows notice and settings link when child and PIN already exist", async () => {
      const pinRecord = await createPinRecord("1234");
      const existingState: AppState = {
        ...buildDemoState(),
        child: { nickname: "Lucas" },
        settings: {
          ...pinRecord,
          allowedMissionIds: Object.values(MISSION_IDS),
        },
      };
      saveState(existingState);

      renderWithTheme(
        <ProviderWrapper>
          <SetupScreen />
        </ProviderWrapper>,
      );

      expect(
        await screen.findByRole("heading", { name: "Parent mode already set up" }),
      ).toBeDefined();
      expect(
        screen.getByText((content) => content.includes("already set up for Lucas")),
      ).toBeDefined();
      expect(screen.getByRole("link", { name: "Go to parent mode" })).toBeDefined();
      expect(screen.getByRole("link", { name: "Manage settings" })).toBeDefined();
    });
  });

  describe("PinGate component", () => {
    it("handles correct PIN, wrong PIN, and lockout after 5 wrong tries", async () => {
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
          <PinGate />
        </ProviderWrapper>,
      );

      await screen.findByRole("heading", { name: "Parent mode" });

      const pinInput = screen.getByLabelText("4-digit PIN");
      const unlockBtn = screen.getByRole("button", { name: "Unlock" });

      // Wrong PIN attempt 1
      fireEvent.change(pinInput, { target: { value: "9999" } });
      fireEvent.click(unlockBtn);
      expect(await screen.findByText("Incorrect PIN. Please try again.")).toBeDefined();
      expect(sessionStore.getSnapshot().isUnlocked).toBe(false);

      // Wrong PIN attempts 2, 3, 4
      for (let i = 2; i <= 4; i += 1) {
        fireEvent.change(pinInput, { target: { value: "9999" } });
        fireEvent.click(unlockBtn);
        expect(await screen.findByText("Incorrect PIN. Please try again.")).toBeDefined();
      }

      // Wrong PIN attempt 5 -> lockout
      fireEvent.change(pinInput, { target: { value: "9999" } });
      fireEvent.click(unlockBtn);

      expect(
        await screen.findByText(/Too many failed attempts. Locked for \d+ seconds\./),
      ).toBeDefined();
      expect((screen.getByRole("button", { name: "Unlock" }) as HTMLButtonElement).disabled).toBe(
        true,
      );

      // Reset for correct attempt
      sessionStore.resetForTesting();

      fireEvent.change(pinInput, { target: { value: "1234" } });
      fireEvent.click(unlockBtn);

      await waitFor(
        () => {
          expect(sessionStore.getSnapshot().isUnlocked).toBe(true);
        },
        { timeout: 5000 },
      );
    });

    it("displays message when crypto.subtle is not available", async () => {
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

      const originalSubtle = globalThis.crypto.subtle;
      Object.defineProperty(globalThis.crypto, "subtle", {
        value: undefined,
        configurable: true,
        writable: true,
      });
      sessionStore.resetForTesting();

      try {
        renderWithTheme(
          <ProviderWrapper>
            <PinGate />
          </ProviderWrapper>,
        );

        expect(
          await screen.findByText(
            "PIN entry requires a secure connection (HTTPS or localhost). Please open this app over HTTPS.",
          ),
        ).toBeDefined();
      } finally {
        Object.defineProperty(globalThis.crypto, "subtle", {
          value: originalSubtle,
          configurable: true,
          writable: true,
        });
        sessionStore.resetForTesting();
      }
    });

    it("shows setup link if stored PIN is empty", async () => {
      const state: AppState = {
        ...buildDemoState(),
        child: { nickname: "Lucas" },
        settings: {
          pinHash: "",
          pinSalt: "",
          allowedMissionIds: Object.values(MISSION_IDS),
        },
      };
      saveState(state);

      renderWithTheme(
        <ProviderWrapper>
          <PinGate />
        </ProviderWrapper>,
      );

      expect(await screen.findByText("No PIN has been created yet.")).toBeDefined();
      expect(screen.getByRole("link", { name: "Set up parent PIN" })).toBeDefined();
    });

    it("renders biometric unlock button and unlocks when biometric verification succeeds", async () => {
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
      sessionStore.resetForTesting();

      localStorage.setItem("mycrohnie:biometric_cred", "test-cred-id");
      vi.stubGlobal("PublicKeyCredential", {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true),
      });
      vi.stubGlobal("navigator", {
        credentials: {
          get: vi.fn().mockResolvedValue({ id: "mock-assertion" }),
        },
      });

      renderWithTheme(
        <ProviderWrapper>
          <PinGate />
        </ProviderWrapper>,
      );

      const bioButton = await screen.findByRole("button", {
        name: /Unlock with Face ID \/ Fingerprint/,
      });
      expect(bioButton).toBeDefined();

      await act(async () => {
        fireEvent.click(bioButton);
      });

      await waitFor(() => {
        expect(sessionStore.getSnapshot().isUnlocked).toBe(true);
      });
    });
  });

  describe("Auto-lock with fake timers", () => {
    it("locks automatically after 90 seconds without interaction, and resets timer on activity", () => {
      vi.useFakeTimers();

      renderWithTheme(<SessionConsumer />);

      expect(screen.getByText("SESSION_LOCKED")).toBeDefined();

      // Unlock
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "Unlock session" }));
      });
      expect(screen.getByText("SESSION_UNLOCKED")).toBeDefined();

      // Advance by 60 seconds (activity before 90s)
      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      expect(screen.getByText("SESSION_UNLOCKED")).toBeDefined();

      // Activity event resets timer
      act(() => {
        window.dispatchEvent(new Event("pointerdown"));
      });

      // Another 60s passed (120s total, but only 60s since activity)
      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      expect(screen.getByText("SESSION_UNLOCKED")).toBeDefined();

      // Another 30s passed (90s since activity) -> locks!
      act(() => {
        vi.advanceTimersByTime(30_000);
      });
      expect(screen.getByText("SESSION_LOCKED")).toBeDefined();

      vi.useRealTimers();
    });
  });

  describe("SummaryCard with demo data", () => {
    it("renders plain facts, confidence labels, discomfort prompt, and navigation buttons", () => {
      const today = todayKey();
      const demoState = buildDemoState({ today });
      // Ensure today has a check-in with discomfort to test gentle food prompt
      demoState.checkIns = [
        {
          id: "checkin-today",
          date: today,
          notToday: false,
          answers: {
            [QUESTION_IDS.bellyComfort]: DISCOMFORT_THRESHOLD,
            [QUESTION_IDS.energy]: 1,
            [QUESTION_IDS.playPace]: 0,
          },
          createdAt: `${today}T12:00:00.000Z`,
        },
      ];
      demoState.missionLogs = [
        {
          id: "mission-today",
          date: today,
          missionId: MISSION_IDS.dragonBreathing,
          status: "completed",
          company: "family",
          confirmedBy: "parent-pin",
          createdAt: `${today}T12:30:00.000Z`,
        },
      ];

      const onLock = vi.fn();
      renderWithTheme(<SummaryCard state={demoState} onLock={onLock} />);

      // Demo data indicator
      expect(screen.getByText("Demo data")).toBeDefined();
      expect(screen.getByText("Daily summary for Lucas")).toBeDefined();

      // Check-in section
      expect(screen.getByText("Answered")).toBeDefined();
      expect(screen.getByText("Belly comfort")).toBeDefined();
      expect(screen.getByText("A little rumble")).toBeDefined();
      expect(screen.getByText("Medium energy")).toBeDefined();
      expect(screen.getByText("Active and on the move")).toBeDefined();

      // Discomfort prompt
      expect(screen.getByText("Want to note what Lucas ate today?")).toBeDefined();
      expect(screen.getByRole("link", { name: "Open food diary" })).toBeDefined();

      // Missions with confidence label
      expect(screen.getByText("Dragon breathing")).toBeDefined();
      expect(screen.getByText("Done with family")).toBeDefined();
      expect(screen.getByText("Status: Completed")).toBeDefined();

      // Doctor appointments card
      expect(screen.getByRole("heading", { name: "Doctor appointments" })).toBeDefined();
      expect(screen.getByText("No upcoming appointment scheduled")).toBeDefined();
      expect(screen.getByText("30 days ago")).toBeDefined();
      expect(screen.getByRole("link", { name: "Manage appointments" })).toBeDefined();

      // Navigation links
      expect(screen.getByRole("link", { name: "Daily log" })).toBeDefined();
      expect(screen.getByRole("link", { name: "Food diary" })).toBeDefined();
      expect(screen.getByRole("link", { name: "Patterns" })).toBeDefined();
      expect(screen.getByRole("link", { name: "Doctor report" })).toBeDefined();
      expect(screen.getByRole("link", { name: "Settings" })).toBeDefined();

      // Lock button
      fireEvent.click(screen.getByRole("button", { name: "Lock" }));
      expect(onLock).toHaveBeenCalled();
    });

    it("renders upcoming appointment countdown badge when scheduled", () => {
      const today = todayKey();
      const demoState = buildDemoState({ today });
      demoState.consultations.push({
        id: "c-future",
        date: addDays(today, 5),
      });

      renderWithTheme(<SummaryCard state={demoState} onLock={vi.fn()} />);

      expect(screen.getByText(addDays(today, 5))).toBeDefined();
      expect(screen.getByText("In 5 days")).toBeDefined();
    });

    it("renders appointment reminder banner when consultation is scheduled for tomorrow", () => {
      const today = todayKey();
      const demoState = buildDemoState({ today });
      demoState.consultations.push({
        id: "c-tomorrow",
        date: addDays(today, 1),
      });

      renderWithTheme(<SummaryCard state={demoState} onLock={vi.fn()} />);

      expect(screen.getByRole("heading", { name: "Doctor appointment tomorrow" })).toBeDefined();
      expect(screen.getByRole("link", { name: "View doctor report" })).toBeDefined();
    });

    it("renders reward claim notification banner when child requested a home reward", () => {
      const today = todayKey();
      const demoState = buildDemoState({ today });
      demoState.economy.specialRewards = [{ id: "r1", name: "Board game night", fireCost: 20 }];
      demoState.economy.rewardClaims = [
        {
          id: "cl1",
          rewardId: "r1",
          date: today,
          createdAt: "2026-10-04T10:00:00Z",
          status: "requested",
        },
      ];

      renderWithTheme(<SummaryCard state={demoState} onLock={vi.fn()} />);

      expect(screen.getByRole("heading", { name: "Family reward requested" })).toBeDefined();
      expect(screen.getByText(/Board game night/)).toBeDefined();
      expect(screen.getByRole("link", { name: "Review rewards" })).toBeDefined();
    });
  });

  describe("SettingsScreen backup import error handling", () => {
    it("displays error clearly when importing an invalid backup file", async () => {
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
          <SettingsScreen />
        </ProviderWrapper>,
      );

      await screen.findByRole("heading", { name: "Parent settings" });

      const fileInput = screen.getByLabelText("Import backup file input");
      const badFile = new File(["{ invalid json file"], "bad.json", {
        type: "application/json",
      });

      fireEvent.change(fileInput, { target: { files: [badFile] } });

      expect(await screen.findByText(/Invalid backup file/)).toBeDefined();
    });
  });

  describe("Session security", () => {
    it("proves unlocked state is never written to localStorage or sessionStorage", () => {
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(sessionStorage.length).toBe(0);

      sessionStore.setUnlocked(true);
      expect(sessionStore.getSnapshot().isUnlocked).toBe(true);

      expect(sessionStorage.length).toBe(0);
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        expect(stored.toLowerCase()).not.toContain("unlocked");
      }

      sessionStore.lock();
      expect(sessionStore.getSnapshot().isUnlocked).toBe(false);
      expect(sessionStorage.length).toBe(0);
    });
  });

  describe("ParentHomeScreen and SettingsScreen gate behavior", () => {
    it("redirects to setup from ParentHomeScreen if child is not configured", async () => {
      renderWithTheme(
        <ProviderWrapper>
          <ParentHomeScreen />
        </ProviderWrapper>,
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(ROUTES.parentSetup);
      });
    });

    it("SettingsScreen shows PinGate when locked, and unlocked view when unlocked", async () => {
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

      // Start locked
      sessionStore.setUnlocked(false);

      const { rerender } = renderWithTheme(
        <ProviderWrapper>
          <SettingsScreen />
        </ProviderWrapper>,
      );

      expect(await screen.findByRole("heading", { name: "Parent settings" })).toBeDefined();
      expect(screen.getByLabelText("4-digit PIN")).toBeDefined();

      // Now unlock session
      act(() => {
        sessionStore.setUnlocked(true);
      });

      rerender(
        <ProviderWrapper>
          <SettingsScreen />
        </ProviderWrapper>,
      );

      expect(screen.getByRole("heading", { name: "Enabled missions" })).toBeDefined();
      expect(screen.getByRole("heading", { name: "Daily care reminder" })).toBeDefined();
      expect(screen.getByRole("heading", { name: "Change PIN" })).toBeDefined();
      expect(screen.getByRole("heading", { name: "Backup and restore" })).toBeDefined();
      expect(screen.getByRole("heading", { name: "Clear all data" })).toBeDefined();
    });

    it("handles Change PIN with current PIN verification and new PIN confirmation", async () => {
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
          <SettingsScreen />
        </ProviderWrapper>,
      );

      await screen.findByRole("heading", { name: "Change PIN" });

      const currentInput = screen.getByLabelText("Current PIN");
      const newInput = screen.getByLabelText("New 4-digit PIN");
      const confirmInput = screen.getByLabelText("Confirm new PIN");
      const updateBtn = screen.getByRole("button", { name: "Update PIN" });

      // Wrong current PIN
      fireEvent.change(currentInput, { target: { value: "0000" } });
      fireEvent.change(newInput, { target: { value: "5678" } });
      fireEvent.change(confirmInput, { target: { value: "5678" } });
      fireEvent.click(updateBtn);

      expect(await screen.findByText("Current PIN is incorrect.")).toBeDefined();

      // Mismatched new PIN
      fireEvent.change(currentInput, { target: { value: "1234" } });
      fireEvent.change(newInput, { target: { value: "5678" } });
      fireEvent.change(confirmInput, { target: { value: "5679" } });
      fireEvent.click(updateBtn);

      expect(await screen.findByText("New PINs do not match.")).toBeDefined();

      // Valid PIN change
      fireEvent.change(confirmInput, { target: { value: "5678" } });
      fireEvent.click(updateBtn);

      expect(await screen.findByText("PIN changed successfully.")).toBeDefined();
    });

    it("handles Load demo data and Clear all data dialog", async () => {
      const pinRecord = await createPinRecord("1234");
      const state: AppState = {
        ...buildDemoState(),
        isDemo: false,
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
          <SettingsScreen />
        </ProviderWrapper>,
      );

      await screen.findByRole("heading", { name: "Demo data" });

      // 1. Load demo data
      const loadDemoBtn = screen.getByRole("button", { name: "Load demo data" });
      fireEvent.click(loadDemoBtn);

      expect(await screen.findByText("Demo PIN: 1234")).toBeDefined();

      // 2. Clear all data dialog
      const clearBtn = screen.getByRole("button", { name: "Clear all data" });
      fireEvent.click(clearBtn);

      // Dialog opens
      expect(screen.getByText("Clear all data?")).toBeDefined();
      expect(
        screen.getByText(
          "This will delete all health logs, notes, check-ins, missions, and settings from this device. This action cannot be undone.",
        ),
      ).toBeDefined();

      // Confirm delete
      const confirmDeleteBtn = screen.getByRole("button", { name: "Yes, delete everything" });
      fireEvent.click(confirmDeleteBtn);

      expect(mockPush).toHaveBeenCalledWith(ROUTES.home);
      expect(sessionStore.getSnapshot().isUnlocked).toBe(false);
    });

    it("configures daily care reminder time in SettingsScreen", async () => {
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
          <SettingsScreen />
        </ProviderWrapper>,
      );

      await screen.findByRole("heading", { name: "Daily care reminder" });
      const enableBtn = screen.getByRole("button", { name: "Enabled" });
      fireEvent.click(enableBtn);

      const timeInput = await screen.findByLabelText("Reminder time");
      fireEvent.change(timeInput, { target: { value: "19:45" } });

      await waitFor(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = JSON.parse(raw as string) as AppState;
        expect(parsed.settings?.reminderEnabled).toBe(true);
        expect(parsed.settings?.reminderTime).toBe("19:45");
      });
    });

    it("displays in-app daily care reminder banner on ParentHomeScreen when due and unrecorded", async () => {
      const pinRecord = await createPinRecord("1234");
      const state: AppState = {
        ...buildDemoState(),
        child: { nickname: "Lucas" },
        settings: {
          ...pinRecord,
          allowedMissionIds: Object.values(MISSION_IDS),
          reminderEnabled: true,
          reminderTime: "00:00", // definitely due today
        },
        parentLogs: [], // no medication logged for today
      };
      saveState(state);
      sessionStore.setUnlocked(true);

      renderWithTheme(
        <ProviderWrapper>
          <ParentHomeScreen />
        </ProviderWrapper>,
      );

      expect(await screen.findByText(/Time for Lucas's daily routine/)).toBeTruthy();
      expect(screen.getByRole("link", { name: "Go to daily log" })).toBeTruthy();
    });
  });
});
