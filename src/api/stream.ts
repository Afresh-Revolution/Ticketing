import { apiUrl } from './config';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('adminToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type StreamableEvent = {
  id: string;
  title: string;
  eventType: string;
  isLive: boolean;
  liveStartedAt?: string | null;
  streamUrl?: string | null;
  streamProvider?: string | null;
  date?: string;
  startTime?: string;
  paidAttendeeCount?: number;
};

export async function fetchStreamableEvents(): Promise<StreamableEvent[]> {
  const res = await fetch(apiUrl('/api/admin/stream/events'), { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load online events');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchStreamEvent(eventId: string): Promise<StreamableEvent> {
  const res = await fetch(apiUrl(`/api/admin/stream/events/${eventId}`), { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load event stream settings');
  return res.json();
}

export async function updateStreamConfig(
  eventId: string,
  body: { streamUrl: string; streamProvider: string },
): Promise<StreamableEvent> {
  const res = await fetch(apiUrl(`/api/admin/stream/events/${eventId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to save stream settings');
  }
  return res.json();
}

export async function goLive(eventId: string): Promise<{
  ok: boolean;
  emailsSent: number;
  attendeeCount: number;
}> {
  const res = await fetch(apiUrl(`/api/admin/stream/events/${eventId}/go-live`), {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to go live');
  return data;
}

export async function endLive(eventId: string): Promise<StreamableEvent> {
  const res = await fetch(apiUrl(`/api/admin/stream/events/${eventId}/end-live`), {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to end stream');
  return res.json();
}

export type LiveStatus = {
  eventId: string;
  eventType: string;
  isLive: boolean;
  liveStartedAt?: string | null;
};

export async function fetchLiveStatus(eventId: string): Promise<LiveStatus> {
  const res = await fetch(apiUrl(`/api/events/${eventId}/live-status`));
  if (!res.ok) throw new Error('Failed to load live status');
  return res.json();
}

export type StreamAccessResponse = {
  ok?: boolean;
  error?: string;
  notLive?: boolean;
  eventTitle?: string;
  embedUrl?: string;
  isLive?: boolean;
};

export async function fetchStreamAccess(eventId: string, token: string): Promise<StreamAccessResponse> {
  const res = await fetch(apiUrl(`/api/events/${eventId}/stream?token=${encodeURIComponent(token)}`));
  return res.json();
}
