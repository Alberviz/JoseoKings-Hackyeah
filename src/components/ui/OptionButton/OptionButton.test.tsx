import { fireEvent, screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { OptionButton } from "./OptionButton";

describe("OptionButton", () => {
  it("is named by its label and reports its selected state", () => {
    renderWithTheme(<OptionButton label="A little" icon="🙂" selected onSelect={() => {}} />);
    expect(screen.getByRole("button", { name: "A little" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("calls onSelect when pressed", () => {
    const onSelect = vi.fn();
    renderWithTheme(<OptionButton label="A lot" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "A lot" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("does not call onSelect when disabled", () => {
    const onSelect = vi.fn();
    renderWithTheme(<OptionButton label="None" disabled onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "None" }));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
