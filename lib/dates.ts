/**
 * ED 07. Dates were being turned into UTC before being shown, so anything
 * published between midnight and three in the morning in Baghdad displayed
 * as the day before, and the next save wrote that earlier day back.
 *
 * Everything here works in her timezone, and a date she picks is stored at
 * midday UTC so no timezone can shift which day it lands on.
 */

export const SITE_TIMEZONE = 'Asia/Baghdad';

/** An ISO moment as the yyyy-mm-dd a date input expects, in her timezone. */
export function toDateInput(iso: string | null): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SITE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(iso));
}

/**
 * A date from the form back into a moment. If the day has not changed, the
 * original moment is kept exactly, so repeated saves never walk the date.
 */
export function fromDateInput(value: string, previous: string | null): string | null {
  if (!value) return null;
  if (previous && toDateInput(previous) === value) return previous;
  return new Date(`${value}T12:00:00Z`).toISOString();
}

/** Words a minute, rounded, never zero. */
export function readingMinutes(body: string): number {
  const words = (body ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
