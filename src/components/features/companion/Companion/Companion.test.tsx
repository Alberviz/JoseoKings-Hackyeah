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
    const forbiddenWords = ["sad", "sick", "tired", "hungry", "bored", "disappointed"];
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
