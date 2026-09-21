/**
 * Asia/Kolkata (IST) Timezone & Puzzle Date Utilities
 *
 * All Daily Game puzzle dates are calendar dates in Indian Standard Time (UTC+5:30).
 * Rollover strictly occurs at 00:00:00 IST.
 */

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Formats a Date object into a canonical puzzle date string (YYYY-MM-DD) in Asia/Kolkata timezone.
 */
export function getIndianCalendarDate(date: Date = new Date()): string {
  // en-CA produces YYYY-MM-DD format directly
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Validates whether a given string is a valid YYYY-MM-DD calendar date.
 */
export function isValidPuzzleDate(dateStr: string | null | undefined): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const [year, month, day] = dateStr.split('-').map(Number);
  if (year < 2000 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Adds N days to a YYYY-MM-DD puzzle date string.
 */
export function addDaysToPuzzleDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);

  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dt = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dt}`;
}

/**
 * Subtracts N days from a YYYY-MM-DD puzzle date string.
 */
export function subtractDaysFromPuzzleDate(dateStr: string, days: number): string {
  return addDaysToPuzzleDate(dateStr, -days);
}

/**
 * Generates an array of consecutive puzzle date strings starting from startDateStr for N days.
 */
export function getPuzzleDatesInRange(startDateStr: string, count: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    dates.push(addDaysToPuzzleDate(startDateStr, i));
  }
  return dates;
}

/**
 * Calculates number of days between two puzzle date strings (dateB - dateA).
 */
export function getDaysDifference(dateA: string, dateB: string): number {
  const [yA, mA, dA] = dateA.split('-').map(Number);
  const [yB, mB, dB] = dateB.split('-').map(Number);
  const timeA = Date.UTC(yA, mA - 1, dA);
  const timeB = Date.UTC(yB, mB - 1, dB);
  return Math.round((timeB - timeA) / (1000 * 60 * 60 * 24));
}
