import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { OptionButton } from "../OptionButton/OptionButton";
import { OptionGroup } from "./OptionGroup";

describe("OptionGroup", () => {
  it("groups the options under the question, even when the legend is hidden", () => {
    renderWithTheme(
      <OptionGroup legend="How is your tummy?" hideLegend>
        <OptionButton label="Fine" onSelect={() => {}} />
        <OptionButton label="Sore" onSelect={() => {}} />
      </OptionGroup>,
    );
    const group = screen.getByRole("group", { name: "How is your tummy?" });
    expect(group).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
});
