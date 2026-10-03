import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { theme } from "@/theme/theme";
import { Button } from "./Button";

describe("Button", () => {
  it("renders its label and handles clicks", () => {
    const handleClick = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <Button onClick={handleClick}>Find a restroom</Button>
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Find a restroom" }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
