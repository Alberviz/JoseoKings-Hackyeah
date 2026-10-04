import { renderWithTheme } from "@/test/renderWithTheme";
import { DynamicBackground } from "./DynamicBackground";

describe("DynamicBackground", () => {
  it("is hidden from assistive technology on every stage", () => {
    for (const stage of [1, 2, 3] as const) {
      const { container, unmount } = renderWithTheme(<DynamicBackground stage={stage} />);
      expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
      unmount();
    }
  });

  it("draws six clouds on every stage", () => {
    for (const stage of [1, 2, 3] as const) {
      const { container, unmount } = renderWithTheme(<DynamicBackground stage={stage} />);
      expect(container.querySelectorAll("svg[viewBox='-24 -24 188 108']")).toHaveLength(6);
      unmount();
    }
  });
});
