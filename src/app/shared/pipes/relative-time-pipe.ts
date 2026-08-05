import { Pipe, PipeTransform } from '@angular/core';

const UNITS: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
];

const INVALID_OUTPUT = '';

@Pipe({
  name: 'relativeTime',
})
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | number | Date | null | undefined, now: number | Date = Date.now()): string {
    const timestamp = toTimestamp(value);
    const reference = toTimestamp(now);

    if (timestamp === null || reference === null) {
      return INVALID_OUTPUT;
    }

    const elapsed = timestamp - reference;
    const formatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

    for (const [unit, unitMs] of UNITS) {
      if (Math.abs(elapsed) >= unitMs) {
        return formatter.format(Math.trunc(elapsed / unitMs), unit);
      }
    }

    return 'hace unos segundos';
  }
}

function toTimestamp(value: string | number | Date | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}