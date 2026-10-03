import { fireEvent, screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { TextField } from "./TextField";

describe("TextField", () => {
  it("links the label to the input and passes the typed value", () => {
    const onChange = vi.fn();
    renderWithTheme(<TextField label="Nickname" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Nickname"), { target: { value: "Lucas" } });
    expect(onChange).toHaveBeenCalledWith("Lucas");
  });

  it("shows the hint and links it to the field", () => {
    renderWithTheme(
      <TextField label="Sleep" value="" onChange={() => {}} hint="Hours, like 8.5" />,
    );
    const field = screen.getByLabelText("Sleep");
    const hintId = field.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(hintId)?.textContent).toBe("Hours, like 8.5");
  });

  it("announces an error and marks the field invalid", () => {
    renderWithTheme(<TextField label="PIN" value="" onChange={() => {}} error="Use 4 digits" />);
    expect(screen.getByRole("alert").textContent).toBe("Use 4 digits");
    expect(screen.getByLabelText("PIN").getAttribute("aria-invalid")).toBe("true");
  });

  it("renders a textarea when multiline", () => {
    renderWithTheme(<TextField label="Note" value="" onChange={() => {}} multiline />);
    expect(screen.getByLabelText("Note").tagName).toBe("TEXTAREA");
  });
});
