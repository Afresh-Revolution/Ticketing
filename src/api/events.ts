import { apiUrl } from './config';

/**
 * The public list defaults to the oldest 50 rows. Once the catalog is larger
 * than that, Explore's Upcoming tab only receives past events and shows 0.
 */
export const PUBLIC_EVENTS_TAKE = 500;

export async function fetchPublicEvents(options?: {
  trending?: boolean;
  take?: number;
}): Promise<unknown[]> {
  const take = options?.take ?? PUBLIC_EVENTS_TAKE;
  const query = new URLSearchParams({ take: String(take) });
  if (options?.trending) query.set('trending', 'true');

  const res = await fetch(apiUrl(`/api/events?${query.toString()}`));
  if (!res.ok) return [];

  const data: unknown = await res.json();
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.events)) return record.events;
    if (Array.isArray(record.data)) return record.data;
    if (Array.isArray(record.items)) return record.items;
  }
  return [];
}
