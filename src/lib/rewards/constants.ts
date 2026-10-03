// Every number of the reward system is here, so it is easy to tune. See docs/ARCHITECTURE.md section 7.

/** Main track: points for a full check-in, whatever the answers. */
export const CHECK_IN_POINTS = 10;
/** Main track: "I don't feel like it today" is a valid check-in with a slightly smaller reward. */
export const NOT_TODAY_POINTS = 6;
/** Main track: a mission finished, whatever its kind. */
export const MISSION_POINTS = 10;
/** Main track: a mission stopped early. Same as "not today". Never a failure. */
export const REST_POINTS = 6;
/** Team track: stars for a finished mission done with someone. Never adds to the main points. */
export const TEAM_STARS_PER_MISSION = 1;

/** Care days needed for the "30 care days" badge. */
export const CARE_DAYS_BADGE_TARGET = 30;
