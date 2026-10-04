// Working name, confirmed for the sprint.
export const APP_NAME = "MyCrohnie";
export const APP_DESCRIPTION =
  "A daily game that helps children with inflammatory bowel disease share how they feel, and helps families and doctors see the picture.";

/** Canonical production URL (Open Graph, metadataBase). */
export const APP_URL = "https://mycrohnie.vercel.app";

export const ROUTES = {
  home: "/",
  checkIn: "/check-in",
  companion: "/companion",
  parent: "/parent",
  parentSetup: "/parent/setup",
  parentLog: "/parent/log",
  parentFoods: "/parent/foods",
  parentPatterns: "/parent/patterns",
  parentReport: "/parent/report",
  parentRewards: "/parent/rewards",
  parentSettings: "/parent/settings",
  offline: "/~offline",
  play: "/play",
  shop: "/shop",
  food: "/food",
  customize: "/customize",
} as const;
