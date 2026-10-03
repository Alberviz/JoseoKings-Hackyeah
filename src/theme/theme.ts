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
  // Minimum touch target: users may be in a hurry or in pain.
  touchTarget: "48px",
  maxContentWidth: "560px",
} as const;

export type AppTheme = typeof theme;
