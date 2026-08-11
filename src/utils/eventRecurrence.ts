export const RECURRENCE_FREQUENCIES = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Every month' },
] as const;

export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number]['value'];

export const WEEKDAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
] as const;

export type Weekday = (typeof WEEKDAYS)[number]['value'];

export type EventRecurrence = {
  isRecurring: boolean;
  recurrenceFrequency: RecurrenceFrequency;
  recurrenceWeekday: Weekday | '';
  recurrenceUntil: string | null;
};

export function normalizeRecurrenceFrequency(value: unknown): RecurrenceFrequency {
  const v = String(value ?? 'none').toLowerCase().trim();
  if (v === 'daily' || v === 'weekly' || v === 'biweekly' || v === 'monthly') return v;
  return 'none';
}

export function normalizeRecurrenceWeekday(value: unknown): Weekday | '' {
  const v = String(value ?? '').toLowerCase().trim();
  const match = WEEKDAYS.find((d) => d.value === v);
  return match ? match.value : '';
}

export function formatRecurrenceBadge(recurrence: Partial<EventRecurrence> | null | undefined): string | null {
  if (!recurrence?.isRecurring) return null;
  const freq = normalizeRecurrenceFrequency(recurrence.recurrenceFrequency);
  if (freq === 'none') return null;
  if (freq === 'daily') return 'Every day';
  if (freq === 'biweekly') {
    const day = normalizeRecurrenceWeekday(recurrence.recurrenceWeekday);
    return day ? `Every 2 weeks · ${capitalize(day)}` : 'Every 2 weeks';
  }
  if (freq === 'monthly') return 'Every month';
  if (freq === 'weekly') {
    const day = normalizeRecurrenceWeekday(recurrence.recurrenceWeekday);
    return day ? `Every ${capitalize(day)}` : 'Weekly';
  }
  return 'Recurring';
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

/** Effective calendar end for past/upcoming: recurrenceUntil > endDate > date. */
export function eventEffectiveEndDate(
  startDate?: string | null,
  endDate?: string | null,
  recurrence?: Partial<EventRecurrence> | null,
): string | null {
  if (recurrence?.isRecurring && recurrence.recurrenceUntil) {
    return recurrence.recurrenceUntil;
  }
  return endDate || startDate || null;
}
