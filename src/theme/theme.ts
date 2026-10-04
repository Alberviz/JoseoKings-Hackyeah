// Single source for design tokens. Never hard-code colors or sizes in .style.ts files.
export const theme = {
  colors: {
    // Hand-made notebook look (decision 2026-10-03): cream paper, navy ink outlines, teal and coral.
    paper: "#F6F0E2",
    paperGrid: "rgba(31, 47, 107, 0.07)",
    ink: "#1F2F6B",
    primary: "#127782",
    primaryHover: "#0E5F69",
    primarySoft: "#D5F1F0",
    onPrimary: "#FFFFFF",
    // Coral is only for fills and outlines, never for text. Text on it is ink.
    accent: "#FF7A59",
    onAccent: "#1F2F6B",
    highlight: "#FFC93C",
    lavender: "#C6B5E8",
    mint: "#E0F7EC",
    urgent: "#B3261E",
    onUrgent: "#FFFFFF",
    success: "#1E7A46",
    successSoft: "#E3F3EA",
    background: "#F6F0E2",
    surface: "#FFFDF6",
    // Soft hairline for the few places that need a quiet divider. Outlines use ink.
    border: "#D8CFB6",
    text: "#1F2F6B",
    textMuted: "#4A557F",
    // Blue ring: the yellow highlight does not reach 3:1 on paper, so it is not used for focus.
    focus: "#0B57D0",
    overlay: "rgba(31, 47, 107, 0.55)",
    // Kraków dragon companion and child home (palette from Baitiare, 2026-10-03).
    dragonBody: "#36C5D4",
    dragonBodyBorder: "#258D9C",
    dragonBelly: "#E0F7EC",
    dragonBellyLines: "#94E3C8",
    dragonWing: "#C6B5E8",
    dragonWingStrut: "#9B82C9",
    dragonEye: "#263B4D",
    dragonHorn: "#E5A825",
    dragonHornHighlight: "#FFE27A",
    dragonCheek: "#F29AA8",
    playButton: "#7054C7",
    childHomeBg: "#BFEAF3",
    // Soft fills for the parent section colours and the answer pills (docs/DESIGN.md).
    coralSoft: "#FFD9CC",
    lavenderSoft: "#E6DDF5",
    highlightSoft: "#FFF0B8",
  },
  // Colour by section in the parent area. fill: banner, card headers, active tab. strong: main button.
  sections: {
    summary: { fill: "#D5F1F0", strong: "#127782", onStrong: "#FFFFFF" },
    log: { fill: "#BFE8CC", strong: "#1E7A46", onStrong: "#FFFFFF" },
    food: { fill: "#FFD9CC", strong: "#FF7A59", onStrong: "#1F2F6B" },
    patterns: { fill: "#E6DDF5", strong: "#C6B5E8", onStrong: "#1F2F6B" },
    more: { fill: "#FFF0B8", strong: "#FFC93C", onStrong: "#1F2F6B" },
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "48px",
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "20px",
    pill: "999px",
    // Leaf corner: three round corners and one tight one, like a hand-cut sticker.
    leaf: "22px 22px 22px 8px",
  },
  fontFamily: {
    heading: 'var(--font-heading), "Bricolage Grotesque", system-ui, sans-serif',
    body: 'var(--font-body), "Atkinson Hyperlegible", system-ui, -apple-system, "Segoe UI", sans-serif',
  },
  fontSize: {
    sm: "0.875rem",
    md: "1rem",
    lg: "1.25rem",
    xl: "1.625rem",
    xxl: "2rem",
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    bold: 700,
  },
  // Outline width for every ink border, and the solid offset shadow used as `${shadowPress} ${ink}`.
  borderWidth: "2.5px",
  shadowPress: "3px 4px 0",
  // Minimum touch target: children aged 8 to 12 and carers who may be tired or in a hurry.
  touchTarget: "48px",
  maxContentWidth: "560px",
} as const;

export type AppTheme = typeof theme;
