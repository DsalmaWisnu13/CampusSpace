/**
 * Interval helpers. Kontrak: interval [start, end).
 * Overlap jika A.start < B.end && B.start < A.end.
 */

export interface Interval {
  startsAt: string;
  endsAt: string;
}

export function toTime(value: string): number {
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) {
    throw new Error(`Waktu tidak valid: ${value}`);
  }
  return t;
}

/** True jika dua interval bertumpuk. Interval yang hanya bersentuhan di batas TIDAK overlap. */
export function intervalsOverlap(a: Interval, b: Interval): boolean {
  return toTime(a.startsAt) < toTime(b.endsAt) && toTime(b.startsAt) < toTime(a.endsAt);
}

export function isValidInterval(interval: Interval): boolean {
  const start = toTime(interval.startsAt);
  const end = toTime(interval.endsAt);
  return Number.isFinite(start) && Number.isFinite(end) && end > start;
}

export function isSameRoom(a: { roomId: string }, b: { roomId: string }): boolean {
  return a.roomId === b.roomId;
}

export function describeInterval(interval: Interval): string {
  return `${interval.startsAt} – ${interval.endsAt}`;
}