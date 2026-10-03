// Single source for design tokens. Never hard-code colors or sizes in .style.ts files.
export const theme = {
  colors: {
    // Purple is the IBD awareness color.
    primary: "#5B3FA8",
    primaryHover: "#4A3289",
    primarySoft: "#EDE8FA",
    onPrimary: "#FFFFFF",
    urgent: "#B3261E",
    onUrgent: "#FFFFFF",
    success: "#1E7A46",
    successSoft: "#E3F3EA",
    background: "#FAF8FF",
    surface: "#FFFFFF",
    border: "#D9D3E8",
    text: "#1D1B22",
    textMuted: "#5C5868",
    focus: "#F2B705",
    overlay: "rgba(29, 27, 34, 0.55)",
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
  // Minimum touch target: children aged 8 to 12 and carers who may be tired or in a hurry.
  touchTarget: "48px",
  maxContentWidth: "560px",
} as const;

export type AppTheme = typeof theme;
