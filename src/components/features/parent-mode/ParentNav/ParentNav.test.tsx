import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/renderWithTheme";
import { ParentNav } from "./ParentNav";

const mocks = vi.hoisted(() => ({
  pathname: "/parent",
  isUnlocked: true,
  lock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
vi.mock("@/hooks/useParentSession", () => ({
  useParentSession: () => ({ isUnlocked: mocks.isUnlocked, lock: mocks.lock }),
}));

function mockReducedMotion(reduced: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduced }) as typeof window.matchMedia;
}

describe("ParentNav", () => {
  beforeEach(() => {
    mocks.pathname = "/parent";
    mocks.isUnlocked = true;
    mocks.lock.mockClear();
    mockReducedMotion(true);
  });

  it("shows the five tabs and marks the current one", () => {
    renderWithTheme(<ParentNav />);
    expect(screen.getByRole("link", { name: /Summary/ }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: /Log/ }).getAttribute("aria-current")).toBeNull();
    expect(screen.getByRole("link", { name: /Food/ })).toBeDefined();
    expect(screen.getByRole("link", { name: /Patterns/ })).toBeDefined();
    expect(screen.getByRole("link", { name: /Report/ }).getAttribute("href")).toBe(
      "/parent/report",
    );
  });

  it("shows the settings gear except on the settings screen", () => {
    const { unmount } = renderWithTheme(<ParentNav />);
    expect(screen.getByRole("link", { name: "Settings" }).getAttribute("href")).toBe(
      "/parent/settings",
    );
    unmount();

    mocks.pathname = "/parent/settings";
    renderWithTheme(<ParentNav />);
    expect(screen.queryByRole("link", { name: "Settings" })).toBeNull();
    expect(screen.getByRole("button", { name: "Exit parent mode" })).toBeDefined();
  });

  it("is hidden while locked and on the setup screen", () => {
    mocks.isUnlocked = false;
    const { unmount } = renderWithTheme(<ParentNav />);
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByRole("button", { name: "Exit parent mode" })).toBeNull();
    unmount();

    mocks.isUnlocked = true;
    mocks.pathname = "/parent/setup";
    renderWithTheme(<ParentNav />);
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("opens the Exit sheet with Lock and Back to child mode", () => {
    renderWithTheme(<ParentNav />);
    fireEvent.click(screen.getByRole("button", { name: "Exit parent mode" }));
    expect(screen.getByRole("link", { name: "Back to child mode" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Lock" }));
    expect(mocks.lock).toHaveBeenCalled();
  });

  it("plays the padlock animation before locking when motion is allowed", () => {
    vi.useFakeTimers();
    mockReducedMotion(false);
    renderWithTheme(<ParentNav />);
    fireEvent.click(screen.getByRole("button", { name: "Exit parent mode" }));
    fireEvent.click(screen.getByRole("button", { name: "Lock" }));
    expect(mocks.lock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Locked" })).toBeDefined();
    vi.advanceTimersByTime(700);
    expect(mocks.lock).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
