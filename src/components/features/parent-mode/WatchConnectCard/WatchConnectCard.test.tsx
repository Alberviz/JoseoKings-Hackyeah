import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/renderWithTheme";
import type { WatchState } from "@/types/watch";
import { WatchConnectCard } from "./WatchConnectCard";

const selectDevice = vi.fn();
let hookState: ReturnType<typeof makeHook>;

function makeHook(overrides: Partial<{ watch: WatchState; metricStatus: unknown }> = {}) {
  return {
    watch: {
      days: [],
      lastSyncAt: null,
      isDemo: false,
      devices: [
        {
          id: "w",
          kind: "watch",
          label: "Watch · Fitbit Charge 6",
          metrics: ["steps", "heartRate", "sleep"],
          sampleCounts: { steps: 5, heartRate: 5, sleep: 5 },
        },
        {
          id: "p",
          kind: "phone",
          label: "Phone · Pixel 8",
          metrics: ["steps"],
          sampleCounts: { steps: 50 },
        },
      ],
      deviceSelection: { steps: null, heartRate: null, sleep: null },
    } as WatchState,
    status: "idle" as const,
    message: null,
    metricStatus: null as unknown,
    isConfigured: true,
    sync: vi.fn(),
    useDemo: vi.fn(),
    clear: vi.fn(),
    selectDevice,
    ...overrides,
  };
}

vi.mock("@/hooks/useWatchSync", () => ({ useWatchSync: () => hookState }));

describe("WatchConnectCard device choice", () => {
  beforeEach(() => {
    selectDevice.mockClear();
    hookState = makeHook();
  });

  it("offers a choice only for the metric that has more than one device", () => {
    renderWithTheme(<WatchConnectCard />);
    expect(screen.getByRole("group", { name: "Steps from" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Automatic (Watch · Fitbit Charge 6)" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Phone · Pixel 8" })).toBeTruthy();
    expect(screen.queryByRole("group", { name: "Heart rate from" })).toBeNull();
    expect(screen.getByText("Heart rate: Watch · Fitbit Charge 6")).toBeTruthy();
    expect(screen.getByText("Sleep: Watch · Fitbit Charge 6")).toBeTruthy();
  });

  it("selects a device for one metric only", () => {
    renderWithTheme(<WatchConnectCard />);
    fireEvent.click(screen.getByRole("button", { name: "Phone · Pixel 8" }));
    expect(selectDevice).toHaveBeenCalledWith("steps", "p");
    fireEvent.click(screen.getByRole("button", { name: "Automatic (Watch · Fitbit Charge 6)" }));
    expect(selectDevice).toHaveBeenCalledWith("steps", null);
  });

  it("shows what each metric returned after a sync", () => {
    hookState = makeHook({
      metricStatus: {
        steps: { status: "ok", count: 0 },
        heartRate: { status: "http-error", httpStatus: 400, reason: "INVALID_FILTER_FIELD" },
        sleep: { status: "ok", count: 3 },
      },
    });
    renderWithTheme(<WatchConnectCard />);
    expect(screen.getByText("Steps: No watch data yet")).toBeTruthy();
    expect(
      screen.getByText("Heart rate: could not be read (Google said: INVALID_FILTER_FIELD)"),
    ).toBeTruthy();
    expect(screen.getByText("Sleep: 3 nights")).toBeTruthy();
  });
});
