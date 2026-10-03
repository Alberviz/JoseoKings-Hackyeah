import type { DateKey } from "@/types";

// All day arithmetic goes through UTC noon so daylight saving changes can never shift a calendar day.

const DAY_MS = 24 * 60 * 60 * 1000;

function parts(key: DateKey): [number, number, number] {
  const [y, m, d] = key.split("-").map(Number);
  return [y, m, d];
}

function toUtcNoon(key: DateKey): number {
  const [y, m, d] = parts(key);
  return Date.UTC(y, m - 1, d, 12);
}

const pad = (n: number) => String(n).padStart(2, "0");

export function isDateKey(value: string): value is DateKey {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = parts(value);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** The local calendar day of a Date, as "YYYY-MM-DD". */
export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey(): DateKey {
  return toDateKey(new Date());
}

export function addDays(key: DateKey, days: number): DateKey {
  const date = new Date(toUtcNoon(key) + days * DAY_MS);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Whole days from `from` to `to`. Positive when `to` is later. */
export function daysBetween(from: DateKey, to: DateKey): number {
  return Math.round((toUtcNoon(to) - toUtcNoon(from)) / DAY_MS);
}

/** 0 is Monday, 6 is Sunday. */
export function weekdayIndex(key: DateKey): number {
  const sundayFirst = new Date(toUtcNoon(key)).getUTCDay();
  return (sundayFirst + 6) % 7;
}

export function isWeekend(key: DateKey): boolean {
  return weekdayIndex(key) >= 5;
}
