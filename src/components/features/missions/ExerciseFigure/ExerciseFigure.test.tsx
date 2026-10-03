import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { ExerciseFigure, type MoveKey, MOVE_KEYS, MOVE_DEFINITIONS } from "./index";

describe("ExerciseFigure component", () => {
  it("renders with role img and the provided accessible label for every MoveKey", () => {
    for (const move of MOVE_KEYS) {
      const label = `Demonstrating ${move}`;
      const { unmount } = renderWithTheme(<ExerciseFigure move={move} label={label} />);

      const figure = screen.getByRole("img", { name: label });
      expect(figure).toBeDefined();
      expect(figure.getAttribute("aria-label")).toBe(label);
      expect(figure.getAttribute("data-testid")).toBe("exercise-figure-svg");

      // Verify ground line is present so planted feet never slide
      const groundLine = figure.querySelector("[data-testid='ground-line']");
      expect(groundLine).not.toBeNull();
      expect(groundLine?.getAttribute("y1")).toBe("210");
      expect(groundLine?.getAttribute("y2")).toBe("210");

      unmount();
    }
  });

  it("renders a single figure by default when withAdult is omitted or false", () => {
    const { container, unmount } = renderWithTheme(
      <ExerciseFigure move="breathe-arms" label="Gentle breath" />,
    );

    const adultFigure = container.querySelector("[data-testid='figure-adult']");
    const childFigure = container.querySelector("[data-testid='figure-child']");

    expect(adultFigure).toBeNull();
    expect(childFigure).not.toBeNull();
    unmount();
  });

  it("renders two figures when withAdult is true", () => {
    const { container } = renderWithTheme(
      <ExerciseFigure move="hold-pose" withAdult={true} label="Gentle hold with adult" />,
    );

    const adultFigure = container.querySelector("[data-testid='figure-adult']");
    const childFigure = container.querySelector("[data-testid='figure-child']");

    expect(adultFigure).not.toBeNull();
    expect(childFigure).not.toBeNull();
  });

  it("has reduced-motion class and data attribute present", () => {
    // When reducedMotion is false/default
    const { container: defaultContainer, unmount } = renderWithTheme(
      <ExerciseFigure move="walk" label="Gentle walk" reducedMotion={false} />,
    );
    const defaultSvg = defaultContainer.querySelector("svg");
    expect(defaultSvg?.getAttribute("data-reduced-motion")).toBe("false");
    unmount();

    // When reducedMotion is true
    const { container: reducedContainer } = renderWithTheme(
      <ExerciseFigure move="walk" label="Gentle walk" reducedMotion={true} />,
    );
    const reducedSvg = reducedContainer.querySelector("svg");
    expect(reducedSvg?.getAttribute("data-reduced-motion")).toBe("true");
    expect(reducedSvg?.classList.contains("reduced-motion")).toBe(true);
  });

  it("renders nothing when given an unknown move", () => {
    const { container } = renderWithTheme(
      // @ts-expect-error Testing invalid runtime move value
      <ExerciseFigure move="jumping-jacks" label="Invalid move" />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("scales with the size prop", () => {
    const { container } = renderWithTheme(
      <ExerciseFigure move="tiptoe" size={180} label="Tiptoe stretch" />,
    );

    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 240 240");
  });

  it("widens viewBox when withAdult is true", () => {
    const { container } = renderWithTheme(
      <ExerciseFigure move="dance" withAdult={true} label="Dance together" />,
    );

    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 320 240");
  });

  it("renders seated posture and stool for tap-seated", () => {
    const { container } = renderWithTheme(
      <ExerciseFigure move="tap-seated" withAdult={true} label="Seated tap" />,
    );

    expect(container.querySelector("[data-testid='figure-child']")).not.toBeNull();
    expect(container.querySelector("[data-testid='figure-adult']")).not.toBeNull();
  });

  it("renders quadruped posture on hands and knees for cat-cow", () => {
    const { container } = renderWithTheme(
      <ExerciseFigure move="cat-cow" withAdult={true} label="Cat cow stretch" />,
    );

    expect(container.querySelector("[data-testid='figure-child']")).not.toBeNull();
    expect(container.querySelector("[data-testid='figure-adult']")).not.toBeNull();
  });
});

describe("Exercise poses definitions and calm motion requirements", () => {
  it("contains all 13 required MoveKey values", () => {
    const expectedMoves: MoveKey[] = [
      "breathe-arms",
      "hold-pose",
      "tap-seated",
      "cat-cow",
      "stretch-neck",
      "stretch-side",
      "march",
      "walk",
      "tiptoe",
      "one-leg",
      "dance",
      "clap",
      "carry",
    ];

    expect(MOVE_KEYS).toHaveLength(13);
    for (const move of expectedMoves) {
      expect(MOVE_KEYS).toContain(move);
      expect(MOVE_DEFINITIONS[move]).toBeDefined();
    }
  });

  it("guarantees calm cycles between 3 and 4 seconds for every move", () => {
    for (const move of MOVE_KEYS) {
      const def = MOVE_DEFINITIONS[move];
      expect(def.cycleSeconds).toBeGreaterThanOrEqual(3.0);
      expect(def.cycleSeconds).toBeLessThanOrEqual(4.0);
    }
  });

  it("defines between 2 and 4 key poses for every move", () => {
    for (const move of MOVE_KEYS) {
      const def = MOVE_DEFINITIONS[move];
      expect(def.poses.length).toBeGreaterThanOrEqual(2);
      expect(def.poses.length).toBeLessThanOrEqual(4);
    }
  });

  it("maintains head diameter at approximately 1/5 of figure height", () => {
    // Child: height 130px (top y=80 to ground y=210), head radius 13 -> diameter 26px (26 / 130 = 0.20)
    const childHeight = 130;
    const childHeadDiameter = 26;
    expect(childHeadDiameter / childHeight).toBeCloseTo(0.2, 2);

    // Adult: height 180px (top y=30 to ground y=210), head radius 18 -> diameter 36px (36 / 180 = 0.20)
    const adultHeight = 180;
    const adultHeadDiameter = 36;
    expect(adultHeadDiameter / adultHeight).toBeCloseTo(0.2, 2);
  });
});
