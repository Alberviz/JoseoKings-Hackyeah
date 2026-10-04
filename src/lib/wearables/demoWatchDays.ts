import type { WatchDay } from "@/types/watch";

export const DEMO_WATCH_DAY_COUNT = 28;

function localDateString(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * 28 fictional days ending today (local time), oldest first. Deterministic for a given day.
 * Always saved with isDemo true and shown as "Demo data".
 */
export function buildDemoWatchDays(today: Date = new Date()): WatchDay[] {
  const days: WatchDay[] = [];
  for (let back = DEMO_WATCH_DAY_COUNT - 1; back >= 0; back--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);
    const wave = Math.sin(back * 0.6);
    const isToday = back === 0;
    days.push({
      date: localDateString(d),
      steps: Math.round(8000 + wave * 1500 + ((back * 37) % 600)),
      restingHr: 70 + Math.round(Math.cos(back * 0.4) * 4),
      sleepMinutes: 490 + ((back * 19) % 50),
      nightComplete: true,
      dayComplete: !isToday,
    });
  }
  return days;
}
