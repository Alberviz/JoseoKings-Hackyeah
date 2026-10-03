/**
 * Turns a mission id like "dragon-breathing" into "Dragon breathing".
 * Local helper for parent mode until task T4 clinical content merges.
 */
export function formatMissionTitle(id: string): string {
  if (!id) return "";
  const spaced = id.replaceAll("-", " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
