import { fireEvent, screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { Button } from "./Button";

describe("Button", () => {
  it("renders its label and handles clicks", () => {
    const handleClick = vi.fn();
    renderWithTheme(<Button onClick={handleClick}>Start mission</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Start mission" }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
