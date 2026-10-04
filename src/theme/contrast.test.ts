import { theme } from "./theme";

function channel(value: number): number {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// WCAG 2.x contrast ratio between two "#RRGGBB" colors.
function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const { colors } = theme;

describe("theme contrast (WCAG AA)", () => {
  const textPairs: [string, string, string][] = [
    ["text on background", colors.text, colors.background],
    ["text on surface", colors.text, colors.surface],
    ["textMuted on background", colors.textMuted, colors.background],
    ["textMuted on surface", colors.textMuted, colors.surface],
    ["onPrimary on primary", colors.onPrimary, colors.primary],
    ["onPrimary on primaryHover", colors.onPrimary, colors.primaryHover],
    ["ink on accent", colors.onAccent, colors.accent],
    ["ink on primarySoft", colors.ink, colors.primarySoft],
    ["ink on highlight", colors.ink, colors.highlight],
    ["primary on background", colors.primary, colors.background],
    ["urgent on background", colors.urgent, colors.background],
    ["success on background", colors.success, colors.background],
  ];

  const sectionPairs: [string, string, string][] = Object.entries(theme.sections).flatMap(
    ([name, { fill, strong, onStrong }]) => [
      [`ink on ${name} fill`, colors.ink, fill] as [string, string, string],
      [`text on ${name} strong`, onStrong, strong] as [string, string, string],
    ],
  );
  const pillPairs: [string, string, string][] = [
    ["ink on coralSoft", colors.ink, colors.coralSoft],
    ["ink on lavenderSoft", colors.ink, colors.lavenderSoft],
    ["ink on highlightSoft", colors.ink, colors.highlightSoft],
    ["ink on mint", colors.ink, colors.mint],
    ["ink on successSoft", colors.ink, colors.successSoft],
  ];

  it.each([...textPairs, ...sectionPairs, ...pillPairs])(
    "%s is at least 4.5:1",
    (_name, foreground, background) => {
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each([
    ["focus on background", colors.focus, colors.background],
    ["focus on surface", colors.focus, colors.surface],
  ])("%s is at least 3:1 (non-text)", (_name, foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(3);
  });
});
