import { fireEvent, screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { Chip } from "./Chip";

describe("Chip", () => {
  it("is plain text when it has no toggle", () => {
    renderWithTheme(<Chip label="Done with family" tone="success" />);
    expect(screen.getByText("Done with family")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("is a toggle button when onToggle is given", () => {
    const onToggle = vi.fn();
    renderWithTheme(<Chip label="Dairy" selected onToggle={onToggle} />);
    const chip = screen.getByRole("button", { name: "Dairy" });
    expect(chip.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(chip);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
