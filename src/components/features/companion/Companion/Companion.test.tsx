import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { ITEM_IDS } from "@/config/content-ids";
import { Companion } from "./Companion";
import { COMPANION_POSES, type CompanionPose } from "./poses";
import { CompanionGallery } from "../CompanionGallery/CompanionGallery";
import {
  Companion as ExportedCompanion,
  CompanionGallery as ExportedGallery,
  COMPANION_POSES as EXPORTED_POSES,
} from "../index";

describe("Companion poses definition", () => {
  it("does not contain forbidden negative states in pose names", () => {
    const forbiddenWords = ["sad", "sick", "angry", "tired", "hungry", "bored", "disappointed"];
    for (const pose of COMPANION_POSES) {
      for (const forbidden of forbiddenWords) {
        expect(pose.toLowerCase()).not.toContain(forbidden);
      }
    }
  });

  it("includes all required poses", () => {
    const requiredPoses: CompanionPose[] = [
      "idle",
      "breathe",
      "stretch",
      "balance",
      "strength",
      "cheer",
    ];
    for (const pose of requiredPoses) {
      expect(COMPANION_POSES).toContain(pose);
    }
  });
});

describe("Companion component", () => {
  it("renders for every pose", () => {
    for (const pose of COMPANION_POSES) {
      const { unmount } = renderWithTheme(<Companion pose={pose} />);
      const svg = screen.getByRole("img");
      expect(svg).toBeDefined();
      expect(svg.getAttribute("aria-label")).toContain(pose);
      unmount();
    }
  });

  it("renders for every size", () => {
    const sizes = ["sm", "md", "lg"] as const;
    for (const size of sizes) {
      const { unmount } = renderWithTheme(<Companion pose="idle" size={size} />);
      const svg = screen.getByRole("img");
      expect(svg).toBeDefined();
      unmount();
    }
  });

  it("has an accessible name based on name and pose", () => {
    const { unmount } = renderWithTheme(<Companion pose="breathe" name="Pip" />);
    const svg = screen.getByRole("img", { name: /Pip.*breathe/i });
    expect(svg).toBeDefined();
    unmount();

    renderWithTheme(<Companion pose="stretch" />);
    const defaultSvg = screen.getByRole("img", { name: /Your companion.*stretch/i });
    expect(defaultSvg).toBeDefined();
  });

  it("ignores unknown item ids without error", () => {
    expect(() => {
      renderWithTheme(
        <Companion
          pose="idle"
          equippedItemIds={["unknown-sword", "random-gadget-xyz", "not-an-item"]}
        />,
      );
    }).not.toThrow();

    const svg = screen.getByRole("img");
    expect(svg).toBeDefined();
  });

  it("equipping two items of the same slot shows only one item", () => {
    // Equipping duplicate or multiple items in the "hat" slot
    const { container } = renderWithTheme(
      <Companion pose="idle" equippedItemIds={[ITEM_IDS.hatExplorer, ITEM_IDS.hatExplorer]} />,
    );

    const hats = container.querySelectorAll("[data-testid='companion-hat']");
    expect(hats.length).toBe(1);
  });

  it("renders equipped items when valid item ids are passed", () => {
    const { container } = renderWithTheme(
      <Companion
        pose="cheer"
        equippedItemIds={[
          ITEM_IDS.hatExplorer,
          ITEM_IDS.capeStar,
          ITEM_IDS.gadgetGoggles,
          ITEM_IDS.colorTeal,
        ]}
      />,
    );

    expect(container.querySelector("[data-testid='companion-hat']")).not.toBeNull();
    expect(container.querySelector("[data-testid='companion-cape']")).not.toBeNull();
    expect(container.querySelector("[data-testid='companion-goggles']")).not.toBeNull();
    expect(container.querySelector("[data-testid='companion-body']")).not.toBeNull();
  });

  it("defaults animated prop to true and exposes data-animated='true'", () => {
    renderWithTheme(<Companion pose="idle" />);
    const svg = screen.getByRole("img");
    expect(svg.getAttribute("data-animated")).toBe("true");
  });

  it("accepts animated={false} and exposes data-animated='false'", () => {
    renderWithTheme(<Companion pose="idle" animated={false} />);
    const svg = screen.getByRole("img");
    expect(svg.getAttribute("data-animated")).toBe("false");
  });

  it("groups head elements so hat and goggles move inside the head container", () => {
    const { container } = renderWithTheme(
      <Companion pose="idle" equippedItemIds={[ITEM_IDS.hatExplorer, ITEM_IDS.gadgetGoggles]} />,
    );

    const headGroup = container.querySelector("[data-testid='companion-head']");
    expect(headGroup).not.toBeNull();
    expect(headGroup?.querySelector("[data-testid='companion-hat']")).not.toBeNull();
    expect(headGroup?.querySelector("[data-testid='companion-goggles']")).not.toBeNull();
  });

  it("renders distinct animated groups for parts: belly, wings, tail, head", () => {
    const { container } = renderWithTheme(<Companion pose="idle" />);
    expect(container.querySelector("[data-testid='companion-belly']")).not.toBeNull();
    expect(container.querySelector("[data-testid='companion-wings']")).not.toBeNull();
    expect(container.querySelector("[data-testid='companion-tail']")).not.toBeNull();
    expect(container.querySelector("[data-testid='companion-head']")).not.toBeNull();
  });

  it("includes prefers-reduced-motion CSS rule disabling animations", () => {
    renderWithTheme(<Companion pose="idle" />);
    const styleTags = document.querySelectorAll("style");
    let hasReducedMotionRule = false;
    for (const style of styleTags) {
      const text = style.textContent || "";
      if (
        text.includes("prefers-reduced-motion") &&
        (text.includes("animation:none") || text.includes("animation: none"))
      ) {
        hasReducedMotionRule = true;
        break;
      }
      if (style.sheet) {
        const rules = Array.from(style.sheet.cssRules).map((r) => r.cssText);
        if (
          rules.some(
            (r) =>
              r.includes("prefers-reduced-motion") &&
              (r.includes("animation: none") || r.includes("animation:none")),
          )
        ) {
          hasReducedMotionRule = true;
          break;
        }
      }
    }
    expect(hasReducedMotionRule).toBe(true);
  });

  it("renders cheer pose with cheer smile and cheer arms", () => {
    const { container } = renderWithTheme(<Companion pose="cheer" />);
    expect(container.querySelector("#dragon-smile-cheer")).not.toBeNull();
    expect(container.querySelector("[data-testid='companion-wings']")).not.toBeNull();
    const wingLeft = container.querySelector("[data-testid='companion-wing-left']");
    expect(wingLeft).not.toBeNull();
  });

  it("updates when transitioning from idle to cheer pose", () => {
    const { container, rerender } = renderWithTheme(<Companion pose="idle" />);
    expect(container.querySelector("#dragon-smile-friendly")).not.toBeNull();

    rerender(<Companion pose="cheer" />);
    expect(container.querySelector("#dragon-smile-cheer")).not.toBeNull();
  });

  it("renders correct dragon artwork according to evolution stage and fire level", () => {
    const { container, rerender } = renderWithTheme(<Companion pose="idle" stage={1} />);
    let image = container.querySelector('[data-testid="companion-exact-artwork"]');
    expect(image?.getAttribute("href")).toBe("/dragon.png");

    rerender(<Companion pose="idle" stage={2} />);
    image = container.querySelector('[data-testid="companion-exact-artwork"]');
    expect(image?.getAttribute("href")).toBe("/dragon_stage2_teen.png");

    rerender(<Companion pose="idle" stage={3} />);
    image = container.querySelector('[data-testid="companion-exact-artwork"]');
    expect(image?.getAttribute("href")).toBe("/dragon_stage3_heroic.png");

    // Dynamic resolution based on fire amount
    rerender(<Companion pose="idle" fire={50} />);
    image = container.querySelector('[data-testid="companion-exact-artwork"]');
    expect(image?.getAttribute("href")).toBe("/dragon.png");

    rerender(<Companion pose="idle" fire={120} />);
    image = container.querySelector('[data-testid="companion-exact-artwork"]');
    expect(image?.getAttribute("href")).toBe("/dragon_stage2_teen.png");

    rerender(<Companion pose="idle" fire={200} />);
    image = container.querySelector('[data-testid="companion-exact-artwork"]');
    expect(image?.getAttribute("href")).toBe("/dragon_stage3_heroic.png");
  });
});

describe("CompanionGallery component", () => {
  it("renders gallery with headings for all poses", () => {
    renderWithTheme(<CompanionGallery />);
    expect(screen.getByRole("heading", { name: /Companion Showcase Gallery/i })).toBeDefined();
    for (const pose of COMPANION_POSES) {
      expect(screen.getByRole("heading", { name: new RegExp(`Pose: ${pose}`, "i") })).toBeDefined();
    }
  });
});

describe("companion module index", () => {
  it("re-exports Companion, CompanionGallery, and poses", () => {
    expect(ExportedCompanion).toBeDefined();
    expect(ExportedGallery).toBeDefined();
    expect(EXPORTED_POSES).toBeDefined();
  });
});
