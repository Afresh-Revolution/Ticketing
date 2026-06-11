export type EventFormat = 'in-person' | 'online' | 'hybrid';
export type DeliveryMode = 'in_person' | 'online';

export function normalizeEventFormat(value?: string | null): EventFormat {
  const v = String(value || 'in-person').toLowerCase().trim();
  if (v === 'online' || v === 'hybrid') return v;
  return 'in-person';
}

export function supportsStreaming(eventType?: string | null): boolean {
  const f = normalizeEventFormat(eventType);
  return f === 'online' || f === 'hybrid';
}

export function normalizeDeliveryMode(
  ticket: { deliveryMode?: string | null },
  eventType?: string | null,
): DeliveryMode {
  if (normalizeEventFormat(eventType) === 'online') return 'online';
  const explicit = String(ticket.deliveryMode || '').toLowerCase().trim();
  if (explicit === 'online' || explicit === 'in_person') {
    return explicit === 'online' ? 'online' : 'in_person';
  }
  return 'in_person';
}

export function isOnlineTicket(
  ticket: { deliveryMode?: string | null },
  eventType?: string | null,
): boolean {
  return normalizeDeliveryMode(ticket, eventType) === 'online';
}

export const STREAM_PROVIDERS = [
  { value: 'youtube', label: 'YouTube / OBS → YouTube' },
  { value: 'twitch', label: 'Twitch' },
  { value: 'embed', label: 'Custom embed URL' },
] as const;
