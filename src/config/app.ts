// Working name, confirmed for the sprint.
export const APP_NAME = "MyCrohnie";
export const APP_DESCRIPTION =
  "A daily game that helps children with inflammatory bowel disease share how they feel, and helps families and doctors see the picture.";

export const ROUTES = {
  home: "/",
  checkIn: "/check-in",
  missions: "/missions",
  companion: "/companion",
  /** Child side of the family link: scan the pairing code, show data codes to the parents. */
  share: "/share",
  parent: "/parent",
  /** Parent side of the family link: show the pairing code, receive the child's data codes. */
  parentLink: "/parent/link",
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
