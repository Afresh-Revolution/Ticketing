/** Shared event discovery categories (Ticketmaster-style segments + GateWav niches). */
export const EVENT_CATEGORIES = [
  'Music',
  'Nightlife',
  'Sports',
  'Comedy',
  'Festivals',
  'Conferences',
  'Theatre',
  'Arts',
  'Food & Drink',
  'Film',
  'Family',
  'Wellness',
  'Tech',
  'Business',
  'Education',
  'Community',
  'Fashion',
  'Gaming',
  'Religion',
  'Charity',
  'Outdoor',
  'Other',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_CATEGORY_FILTERS = ['All', ...EVENT_CATEGORIES] as const;

export function normalizeEventCategory(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return 'Other';
  const match = EVENT_CATEGORIES.find((c) => c.toLowerCase() === raw.toLowerCase());
  if (match) return match;
  // Legacy aliases
  if (/^art$/i.test(raw)) return 'Arts';
  if (/^food$/i.test(raw)) return 'Food & Drink';
  if (/^tech$/i.test(raw)) return 'Tech';
  return raw;
}
