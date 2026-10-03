// Working name, still to be confirmed by the team.
export const APP_NAME = "Mycrohnie";
export const APP_DESCRIPTION =
  "A daily game that helps children with inflammatory bowel disease share how they feel, and helps families and doctors see the picture.";

export const ROUTES = {
  home: "/",
  checkIn: "/check-in",
  missions: "/missions",
  companion: "/companion",
  shop: "/shop",
  food: "/food",
  customize: "/customize",
  parent: "/parent",
  parentSetup: "/parent/setup",
  parentLog: "/parent/log",
  parentFoods: "/parent/foods",
  parentPatterns: "/parent/patterns",
  parentReport: "/parent/report",
  parentSettings: "/parent/settings",
  offline: "/~offline",
  play: "/play",
  shop: "/shop",
  food: "/food",
  customize: "/customize",
} as const;

/** Missions are opened by id: `${ROUTES.missions}/${missionId}`. */
export const missionRoute = (missionId: string) => `${ROUTES.missions}/${missionId}`;
