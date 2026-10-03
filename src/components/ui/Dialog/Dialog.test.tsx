import { fireEvent, screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { Text } from "../Text/Text";
import { Dialog } from "./Dialog";

describe("Dialog", () => {
  it("shows its title and content when open", () => {
    renderWithTheme(
      <Dialog open title="Enter PIN" onClose={() => {}}>
        <Text>Ask a parent</Text>
      </Dialog>,
    );
    expect(screen.getByRole("dialog", { name: "Enter PIN" })).toBeTruthy();
    expect(screen.getByText("Ask a parent")).toBeTruthy();
  });

  it("is not exposed when closed", () => {
    renderWithTheme(
      <Dialog open={false} title="Hidden" onClose={() => {}}>
        <Text>Nothing here</Text>
      </Dialog>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("calls onClose from the close button", () => {
    const onClose = vi.fn();
    renderWithTheme(
      <Dialog open title="Done" closeLabel="Close window" onClose={onClose}>
        <Text>Body</Text>
      </Dialog>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close window" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
