import { CHEST_COINS, REST_COINS } from "@/config/economy";
import { PLAY_GAMES, type PlayGame, type PlayLevel, type PlayMode } from "@/content/games";
import type { MoveKey } from "@/components/features/missions";
import { MOVE_KEYS } from "@/components/features/missions/ExerciseFigure/poses";
import type { MissionStatus } from "@/types";

export function getMatchingPlayGames(
  mode: PlayMode,
  level: PlayLevel,
  allGames: PlayGame[] = PLAY_GAMES,
): PlayGame[] {
  // 1. Matches for mode & level
  const exact = allGames.filter((g) => g.mode === mode && g.level === level);
  if (exact.length > 0) return exact;

  // 2. Nearest lower level
  for (let l = (level - 1) as PlayLevel; l >= 1; l--) {
    const lower = allGames.filter((g) => g.mode === mode && g.level === l);
    if (lower.length > 0) return lower;
  }

  // 3. Any game of that mode
  const modeGames = allGames.filter((g) => g.mode === mode);
  if (modeGames.length > 0) return modeGames;

  // 4. Any game
  return allGames;
}

export function toMoveKey(poseKey: string): MoveKey {
  if (poseKey === "reach-up" || poseKey === "twist") {
    return "stretch-side";
  }
  if (MOVE_KEYS.includes(poseKey as MoveKey)) {
    return poseKey as MoveKey;
  }
  return "hold-pose";
}

export function getCoinsForPlay(status: MissionStatus): number {
  return status === "completed" ? CHEST_COINS : REST_COINS;
}
