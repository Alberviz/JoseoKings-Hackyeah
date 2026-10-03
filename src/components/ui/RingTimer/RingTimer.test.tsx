import { screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { ThemeProvider } from "styled-components";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/renderWithTheme";
import { theme } from "@/theme/theme";
import { formatTime, RingTimer } from "./RingTimer";

function renderRingTimer(ui: ReactElement) {
  const result = renderWithTheme(ui);
  return {
    ...result,
    rerenderWithTheme: (nextUi: ReactElement) =>
      result.rerender(<ThemeProvider theme={theme}>{nextUi}</ThemeProvider>),
  };
}

describe("RingTimer", () => {
  it("renders with role timer, aria-live off, and the provided accessible label", () => {
    renderRingTimer(<RingTimer remaining={45} progress={0.25} label="Exercise timer" />);

    const timer = screen.getByRole("timer", { name: "Exercise timer" });
    expect(timer).toBeDefined();
    expect(timer.getAttribute("aria-live")).toBe("off");
    expect(timer.getAttribute("aria-label")).toBe("Exercise timer");
  });

  it("displays the remaining time as m:ss in the centre", () => {
    const { rerenderWithTheme } = renderRingTimer(
      <RingTimer remaining={65} progress={0.1} label="Time left" />,
    );
    expect(screen.getByText("1:05")).toBeDefined();

    rerenderWithTheme(<RingTimer remaining={5} progress={0.9} label="Time left" />);
    expect(screen.getByText("0:05")).toBeDefined();

    rerenderWithTheme(<RingTimer remaining={0} progress={1} label="Time left" />);
    expect(screen.getByText("0:00")).toBeDefined();
  });

  it("draws track and progress circles within SVG", () => {
    const { container } = renderRingTimer(
      <RingTimer remaining={30} progress={0.5} label="Time left" />,
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeDefined();
    expect(svg?.getAttribute("viewBox")).toBe("0 0 160 160");

    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(2);

    const [trackCircle, progressCircle] = circles;
    expect(trackCircle.getAttribute("r")).toBe("70");
    expect(progressCircle.getAttribute("r")).toBe("70");

    const dashArray = Number.parseFloat(progressCircle.getAttribute("stroke-dasharray") ?? "0");
    const dashOffset = Number.parseFloat(progressCircle.getAttribute("stroke-dashoffset") ?? "0");

    expect(dashArray).toBeCloseTo(2 * Math.PI * 70, 1);
    // At progress 0.5, offset should be half of circumference
    expect(dashOffset).toBeCloseTo(dashArray * 0.5, 1);
  });

  it("updates visually hidden text only every 10 seconds for screen readers", () => {
    const { rerenderWithTheme } = renderRingTimer(
      <RingTimer remaining={30} progress={0} label="Time left" />,
    );

    // Initial announcement at 30s
    expect(screen.getByText("Time left: 30 seconds remaining")).toBeDefined();

    // At 25s, it should NOT update yet
    rerenderWithTheme(<RingTimer remaining={25} progress={0.16} label="Time left" />);
    expect(screen.getByText("Time left: 30 seconds remaining")).toBeDefined();
    expect(screen.queryByText("Time left: 25 seconds remaining")).toBeNull();

    // At 20s, it reaches a 10-second mark and updates
    rerenderWithTheme(<RingTimer remaining={20} progress={0.33} label="Time left" />);
    expect(screen.getByText("Time left: 20 seconds remaining")).toBeDefined();

    // At 15s, does not update
    rerenderWithTheme(<RingTimer remaining={15} progress={0.5} label="Time left" />);
    expect(screen.getByText("Time left: 20 seconds remaining")).toBeDefined();

    // At 10s, updates to 10s
    rerenderWithTheme(<RingTimer remaining={10} progress={0.66} label="Time left" />);
    expect(screen.getByText("Time left: 10 seconds remaining")).toBeDefined();

    // At 0s, updates to 0s
    rerenderWithTheme(<RingTimer remaining={0} progress={1} label="Time left" />);
    expect(screen.getByText("Time left: 0 seconds remaining")).toBeDefined();
  });

  it("clamps progress between 0 and 1 for stroke dash calculations", () => {
    const { container, rerenderWithTheme } = renderRingTimer(
      <RingTimer remaining={60} progress={-0.5} label="Time left" />,
    );
    let progressCircle = container.querySelectorAll("circle")[1];
    const circumference = Number.parseFloat(progressCircle.getAttribute("stroke-dasharray") ?? "0");
    expect(Number.parseFloat(progressCircle.getAttribute("stroke-dashoffset") ?? "0")).toBeCloseTo(
      circumference,
      1,
    );

    rerenderWithTheme(<RingTimer remaining={0} progress={1.5} label="Time left" />);
    progressCircle = container.querySelectorAll("circle")[1];
    expect(Number.parseFloat(progressCircle.getAttribute("stroke-dashoffset") ?? "0")).toBeCloseTo(
      0,
      1,
    );
  });
});

describe("formatTime", () => {
  it("formats standard seconds into m:ss", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(9)).toBe("0:09");
    expect(formatTime(10)).toBe("0:10");
    expect(formatTime(59)).toBe("0:59");
    expect(formatTime(60)).toBe("1:00");
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(359)).toBe("5:59");
  });

  it("handles negative values cleanly", () => {
    expect(formatTime(-10)).toBe("0:00");
  });
});
