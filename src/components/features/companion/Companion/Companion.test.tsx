import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { renderWithTheme } from "@/test/renderWithTheme";
import { theme as defaultTheme } from "@/theme/theme";
import { ITEM_IDS } from "@/config/content-ids";
import { Companion, getDragonArtwork } from "./Companion";
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
      "eat",
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

  it("renders visible shop wearables (hat, glasses, t-shirt) on top of dragon with refined transforms", () => {
    const { container } = renderWithTheme(
      <Companion pose="idle" stage={2} equippedItemIds={["hat", "glasses", "t-shirt"]} />,
    );

    const hat = container.querySelector("[data-testid='companion-wearable-hat']");
    const glasses = container.querySelector("[data-testid='companion-wearable-glasses']");
    const tshirt = container.querySelector("[data-testid='companion-wearable-tshirt']");

    expect(hat).not.toBeNull();
    expect(glasses).not.toBeNull();
    expect(tshirt).not.toBeNull();
    expect(hat?.getAttribute("transform")).toContain("translate(107, 40)");
    expect(tshirt?.getAttribute("transform")).toContain("translate(109, 107)");
  });

  it("renders alternative wearables (cap, sunglasses, sport-shirt) and enforces single item per slot", () => {
    const { container } = renderWithTheme(
      <Companion
        pose="idle"
        stage={1}
        equippedItemIds={["cap", "hat", "sunglasses", "glasses", "sport-shirt", "t-shirt"]}
      />,
    );

    expect(container.querySelector("[data-testid='companion-wearable-cap']")).not.toBeNull();
    expect(container.querySelector("[data-testid='companion-wearable-hat']")).toBeNull();

    expect(container.querySelector("[data-testid='companion-wearable-sunglasses']")).not.toBeNull();
    expect(container.querySelector("[data-testid='companion-wearable-glasses']")).toBeNull();

    expect(
      container.querySelector("[data-testid='companion-wearable-sport-shirt']"),
    ).not.toBeNull();
    expect(container.querySelector("[data-testid='companion-wearable-tshirt']")).toBeNull();
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

  it("renders eat pose with flame puff and eat smile", () => {
    const { container } = renderWithTheme(<Companion pose="eat" animated={true} />);
    expect(screen.getByTestId("companion-flame-puff")).toBeDefined();
    expect(container.querySelector("#dragon-smile-eat")).not.toBeNull();
  });

  it("defaults stage prop to 1 and renders Stage 1 baby dragon horn", () => {
    const { container } = renderWithTheme(<Companion pose="idle" />);
    const svg = screen.getByRole("img");
    expect(svg.getAttribute("data-stage")).toBe("1");
    expect(container.querySelector("[data-testid='dragon-horn-stage-1']")).not.toBeNull();
    expect(container.querySelector("[data-testid='dragon-horn-stage-2']")).toBeNull();
    expect(container.querySelector("[data-testid='dragon-horn-stage-3']")).toBeNull();
  });

  it("renders Stage 2 young dragon with golden accent horn", () => {
    const { container } = renderWithTheme(<Companion pose="idle" stage={2} />);
    const svg = screen.getByRole("img");
    expect(svg.getAttribute("data-stage")).toBe("2");
    expect(container.querySelector("[data-testid='dragon-horn-stage-1']")).toBeNull();
    expect(container.querySelector("[data-testid='dragon-horn-stage-2']")).not.toBeNull();
    expect(container.querySelector("[data-testid='dragon-horn-stage-3']")).toBeNull();
  });

  it("renders Stage 3 hero dragon with prominent hero crest and radiant horns", () => {
    const { container } = renderWithTheme(<Companion pose="idle" stage={3} />);
    const svg = screen.getByRole("img");
    expect(svg.getAttribute("data-stage")).toBe("3");
    expect(container.querySelector("[data-testid='dragon-horn-stage-1']")).toBeNull();
    expect(container.querySelector("[data-testid='dragon-horn-stage-2']")).toBeNull();
    expect(container.querySelector("[data-testid='dragon-horn-stage-3']")).not.toBeNull();
  });

  it("uses theme token colors without hardcoded hex literals in dragon elements", () => {
    const customColors = {
      ...defaultTheme.colors,
      dragonBody: "rgb(12, 34, 56)",
      dragonWing: "rgb(78, 90, 12)",
      dragonBelly: "rgb(200, 210, 220)",
      dragonHorn: "rgb(250, 200, 50)",
    };
    const customTheme = { ...defaultTheme, colors: customColors } as unknown as typeof defaultTheme;

    const { container } = render(
      <ThemeProvider theme={customTheme}>
        <Companion pose="idle" stage={2} />
      </ThemeProvider>,
    );
    const bodyPath = container.querySelector("[data-testid='companion-body'] path");
    expect(bodyPath?.getAttribute("fill")).toBe("rgb(12, 34, 56)");

    const wingPath = container.querySelector("[data-testid='companion-wing-left'] path");
    expect(wingPath?.getAttribute("fill")).toBe("rgb(78, 90, 12)");

    const bellyPath = container.querySelector("[data-testid='companion-belly'] path");
    expect(bellyPath?.getAttribute("fill")).toBe("rgb(200, 210, 220)");

    const hornPath = container.querySelector("[data-testid='dragon-horn-stage-2'] path");
    expect(hornPath?.getAttribute("fill")).toBe("rgb(250, 200, 50)");
  });

  it("renders official Kraków dragon artwork image according to evolution stage", () => {
    const { rerender } = renderWithTheme(<Companion pose="idle" stage={1} />);
    let artwork = screen.getByTestId("companion-artwork");
    expect(artwork.getAttribute("href")).toBe("/dragon.png");

    rerender(<Companion pose="idle" stage={2} />);
    artwork = screen.getByTestId("companion-artwork");
    expect(artwork.getAttribute("href")).toBe("/dragon_stage2_teen.png");

    rerender(<Companion pose="idle" stage={3} />);
    artwork = screen.getByTestId("companion-artwork");
    expect(artwork.getAttribute("href")).toBe("/dragon_stage3_heroic.png");
  });

  it("selects correct integrated raster accessory artwork for all stages", () => {
    expect(getDragonArtwork(1, [])).toBe("/dragon.png");
    expect(getDragonArtwork(1, ["glasses"])).toBe("/dragon_stage1_glasses.png");
    expect(getDragonArtwork(1, ["sunglasses"])).toBe("/dragon_stage1_glasses.png");
    expect(getDragonArtwork(1, ["glasses", "t-shirt"])).toBe("/dragon_stage1_shirt.png");
    expect(getDragonArtwork(1, ["glasses", "t-shirt", "hat"])).toBe("/dragon_stage1_all.png");

    expect(getDragonArtwork(2, ["glasses"])).toBe("/dragon_stage2_glasses.png");
    expect(getDragonArtwork(2, ["t-shirt"])).toBe("/dragon_stage2_shirt.png");
    expect(getDragonArtwork(2, ["hat"])).toBe("/dragon_stage2_all.png");

    expect(getDragonArtwork(3, ["sunglasses"])).toBe("/dragon_stage3_glasses.png");
    expect(getDragonArtwork(3, ["sport-shirt"])).toBe("/dragon_stage3_shirt.png");
    expect(getDragonArtwork(3, ["cap"])).toBe("/dragon_stage3_all.png");

    const { rerender } = renderWithTheme(
      <Companion pose="idle" stage={2} equippedItemIds={["glasses", "t-shirt"]} />,
    );
    const artwork = screen.getByTestId("companion-artwork");
    expect(artwork.getAttribute("href")).toBe("/dragon_stage2_shirt.png");

    rerender(<Companion pose="idle" stage={3} equippedItemIds={["hat"]} />);
    expect(screen.getByTestId("companion-artwork").getAttribute("href")).toBe(
      "/dragon_stage3_all.png",
    );
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
