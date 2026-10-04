import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { resetFamilyLinkForTesting } from "@/hooks/useFamilyLink";
import { sessionStore } from "@/hooks/useParentSession";
import { buildDemoState } from "@/lib/demo-data";
import { createPinRecord } from "@/lib/pin";
import { saveState } from "@/lib/storage";
import { renderWithTheme } from "@/test/renderWithTheme";
import { theme } from "@/theme/theme";
import { encodePairing, generateFamilyId, generateFamilyKey, LINK_VERSION } from "@/lib/link";
import { FamilyLinkScreen } from "./FamilyLinkScreen/FamilyLinkScreen";
import { ShareScreen } from "./ShareScreen/ShareScreen";

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

describe("Family Link Screens (Camera-free offline file and code transfer)", () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    sessionStore.resetForTesting();
    resetFamilyLinkForTesting();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  describe("FamilyLinkScreen", () => {
    it("renders setup needed when PIN is not configured", async () => {
      renderWithTheme(
        <ProviderWrapper>
          <FamilyLinkScreen />
        </ProviderWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Setup needed")).toBeDefined();
      });
    });

    it("renders PinGate when locked, and unlocked link controls when unlocked", async () => {
      const pinRecord = await createPinRecord("1234");
      const demoState = buildDemoState();
      saveState({
        ...demoState,
        child: { nickname: "Lucas" },
        settings: {
          ...pinRecord,
          allowedMissionIds: [],
        },
      });

      renderWithTheme(
        <ProviderWrapper>
          <FamilyLinkScreen />
        </ProviderWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Family link")).toBeDefined();
        expect(screen.getByLabelText("4-digit PIN")).toBeDefined();
      });

      // Unlock session
      act(() => {
        sessionStore.setUnlocked(true);
      });

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Create family link" })).toBeDefined();
      });

      // Create link
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Create family link" }));
      });

      await waitFor(() => {
        expect(screen.getByText("Pairing file & code")).toBeDefined();
        expect(screen.getByText("💾 Download pairing file (.link)")).toBeDefined();
        expect(screen.getByText("📁 Upload sync file (.enc / .txt)")).toBeDefined();
        expect(screen.getByRole("button", { name: "Import pasted code" })).toBeDefined();
      });
    });
  });

  describe("ShareScreen", () => {
    it("renders link instructions and file/code input when not yet linked", async () => {
      renderWithTheme(
        <ProviderWrapper>
          <ShareScreen />
        </ProviderWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Connect with your parents' phone")).toBeDefined();
        expect(screen.getByText("📁 Select pairing file (.link / .txt)")).toBeDefined();
        expect(screen.getByRole("button", { name: "Link with pasted code" })).toBeDefined();
      });
    });

    it("successfully links when pasting valid pairing code", async () => {
      const pairingCode = encodePairing({
        v: LINK_VERSION,
        familyId: generateFamilyId(),
        keyB64: generateFamilyKey(),
        nickname: "Lucas",
        allowedMissionIds: [],
        specialRewards: [],
        createdAt: new Date().toISOString(),
      });

      renderWithTheme(
        <ProviderWrapper>
          <ShareScreen />
        </ProviderWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Link with pasted code" })).toBeDefined();
      });

      const textarea = screen.getByLabelText("Paste pairing code");
      fireEvent.change(textarea, {
        target: {
          value: pairingCode,
        },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Link with pasted code" }));
      });

      await waitFor(() => {
        expect(screen.getByText("Linked with your family's phone")).toBeDefined();
        expect(screen.getByText("💾 Download sync file (.enc)")).toBeDefined();
      });
    });
  });
});
