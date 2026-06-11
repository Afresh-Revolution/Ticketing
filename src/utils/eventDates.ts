const EVENT_TZ = 'Africa/Lagos';

function datePartFromValue(value: string | null | undefined): string {
  if (!value) return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Event start as a local Date from date + optional HH:mm start time. */
export function parseEventStart(
  eventDate?: string | null,
  startTime?: string | null,
): Date | null {
  const datePart = datePartFromValue(eventDate);
  if (!datePart) return null;
  const time = String(startTime || '00:00').trim() || '00:00';
  const normalizedTime = /^\d{1,2}:\d{2}$/.test(time) ? `${time}:00` : time;
  const parsed = new Date(`${datePart}T${normalizedTime}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  started: boolean;
};

export function getCountdownParts(target: Date | null, now = new Date()): CountdownParts | null {
  if (!target) return null;
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, started: true };
  }
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms % 86400000) / 3600000),
    minutes: Math.floor((ms % 3600000) / 60000),
    seconds: Math.floor((ms % 60000) / 1000),
    started: false,
  };
}

/** Human-readable countdown until event start (matches ticket email wording). */
export function formatCountdownLabel(target: Date | null, now = new Date()): string {
  const parts = getCountdownParts(target, now);
  if (!parts) return '';
  if (parts.started) return 'Starting soon';
  const labels: string[] = [];
  if (parts.days > 0) labels.push(`${parts.days} day${parts.days === 1 ? '' : 's'}`);
  if (parts.hours > 0) labels.push(`${parts.hours} hour${parts.hours === 1 ? '' : 's'}`);
  if (parts.days === 0 && parts.minutes > 0) {
    labels.push(`${parts.minutes} minute${parts.minutes === 1 ? '' : 's'}`);
  }
  return labels.length ? `Starts in ${labels.join(', ')}` : 'Starts very soon';
}

export function formatEventScheduleLines(
  eventDate?: string | null,
  startTime?: string | null,
  endTime?: string | null,
  endDate?: string | null,
): { dayName: string; dateLine: string; timeLine: string } {
  const start = parseEventStart(eventDate, startTime);
  if (!start) return { dayName: '', dateLine: '', timeLine: '' };

  const dayName = start.toLocaleDateString('en-NG', { weekday: 'long', timeZone: EVENT_TZ });
  const dateLine = start.toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: EVENT_TZ,
  });
  const startLabel = start.toLocaleTimeString('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: EVENT_TZ,
  });

  let timeLine = startLabel;
  if (endTime) {
    const endPart = datePartFromValue(endDate || eventDate);
    const endParsed = parseEventStart(endPart, endTime);
    if (endParsed) {
      const endLabel = endParsed.toLocaleTimeString('en-NG', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: EVENT_TZ,
      });
      timeLine = `${startLabel} – ${endLabel}`;
    }
  }

  return { dayName, dateLine, timeLine };
}

function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const s = String(value).trim();
  const datePart = s.includes('T') ? s.split('T')[0] : s.slice(0, 10);
  const d = new Date(`${datePart}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatShortTag(d: Date): string {
  const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();
  return `${month} ${d.getDate()}`;
}

/** Card date badge: "JUN 5" or "JUN 5 – JUN 7" when end differs from start. */
export function formatEventDateTag(
  startDate: string | null | undefined,
  endDate?: string | null | undefined,
): string {
  const start = parseDateOnly(startDate);
  if (!start) return 'TBD';
  const end = parseDateOnly(endDate);
  if (!end) return formatShortTag(start);
  const startKey = start.toISOString().slice(0, 10);
  const endKey = end.toISOString().slice(0, 10);
  if (startKey === endKey) return formatShortTag(start);
  return `${formatShortTag(start)} – ${formatShortTag(end)}`;
}

/** Long form for detail pages. */
export function formatEventDateLong(
  startDate: string | null | undefined,
  endDate?: string | null | undefined,
): string {
  const start = parseDateOnly(startDate);
  if (!start) return 'TBD';
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const startStr = start.toLocaleDateString('en-US', opts);
  const end = parseDateOnly(endDate);
  if (!end) return startStr;
  const startKey = start.toISOString().slice(0, 10);
  const endKey = end.toISOString().slice(0, 10);
  if (startKey === endKey) return startStr;
  const endStr = end.toLocaleDateString('en-US', opts);
  return `${startStr} – ${endStr}`;
}
