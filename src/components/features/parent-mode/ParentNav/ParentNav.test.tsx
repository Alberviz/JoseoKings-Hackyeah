import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/renderWithTheme";
import { ParentNav } from "./ParentNav";

const mocks = vi.hoisted(() => ({
  pathname: "/parent",
  isUnlocked: true,
  deviceRole: "both",
  lock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
vi.mock("@/hooks/useParentSession", () => ({
  useParentSession: () => ({ isUnlocked: mocks.isUnlocked, lock: mocks.lock }),
}));
vi.mock("@/hooks/useAppState", () => ({
  useAppState: () => ({ state: { settings: { deviceRole: mocks.deviceRole } } }),
}));

describe("ParentNav", () => {
  beforeEach(() => {
    mocks.pathname = "/parent";
    mocks.isUnlocked = true;
    mocks.deviceRole = "both";
  });

  it("shows the tabs and marks the current one", () => {
    renderWithTheme(<ParentNav />);
    expect(screen.getByRole("link", { name: /Summary/ }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: /Log/ }).getAttribute("aria-current")).toBeNull();
    expect(screen.getByRole("link", { name: /Food/ })).toBeDefined();
    expect(screen.getByRole("link", { name: /Patterns/ })).toBeDefined();
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
  });

  it("is hidden while locked and on the setup screen", () => {
    mocks.isUnlocked = false;
    const { unmount } = renderWithTheme(<ParentNav />);
    expect(screen.queryByRole("navigation")).toBeNull();
    unmount();

    mocks.isUnlocked = true;
    mocks.pathname = "/parent/setup";
    renderWithTheme(<ParentNav />);
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("opens More with the other sections and locks", () => {
    renderWithTheme(<ParentNav />);
    fireEvent.click(screen.getByRole("button", { name: /More/ }));
    expect(screen.getByRole("link", { name: "Doctor report" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Family link" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Back to child mode" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Lock" }));
    expect(mocks.lock).toHaveBeenCalled();
  });

  it("does not offer Back to child mode on a parent-only device", () => {
    mocks.deviceRole = "parent";
    renderWithTheme(<ParentNav />);
    fireEvent.click(screen.getByRole("button", { name: /More/ }));
    expect(screen.queryByRole("link", { name: "Back to child mode" })).toBeNull();
  });
});
