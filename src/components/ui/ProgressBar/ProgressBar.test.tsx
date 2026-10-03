import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  it("exposes its value, range and label", () => {
    renderWithTheme(<ProgressBar value={30} max={120} label="Progress to next item" />);
    const bar = screen.getByRole("progressbar", { name: "Progress to next item" });
    expect(bar.getAttribute("aria-valuenow")).toBe("30");
    expect(bar.getAttribute("aria-valuemax")).toBe("120");
  });

  it("keeps the value inside the range", () => {
    renderWithTheme(<ProgressBar value={500} max={100} label="Over" />);
    expect(screen.getByRole("progressbar", { name: "Over" }).getAttribute("aria-valuenow")).toBe(
      "100",
    );
  });

  it("does not break with a zero or negative range", () => {
    renderWithTheme(<ProgressBar value={-5} max={0} label="Empty" />);
    expect(screen.getByRole("progressbar", { name: "Empty" }).getAttribute("aria-valuenow")).toBe(
      "0",
    );
  });
});
