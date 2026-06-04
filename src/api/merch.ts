import { apiUrl } from './config';
import type { EventMerchDto } from '../types/merch';
import { normalizeEventMerch } from '../types/merch';

export type MerchOrderPayload = {
  eventId: string;
  items: Array<{
    merchId: string;
    imageId: string;
    typeName?: string;
    colorName?: string;
    quantity: number;
  }>;
  totalAmount: number;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  paymentMethod: 'paystack' | 'manual';
};

export async function fetchEventMerch(eventId: string): Promise<EventMerchDto[]> {
  const res = await fetch(apiUrl(`/api/events/${eventId}/merch`));
  if (!res.ok) {
    const fromEvent = await fetch(apiUrl(`/api/events/${eventId}`));
    if (fromEvent.ok) {
      const data = await fromEvent.json();
      return normalizeEventMerch(data.merch ?? data.eventMerch);
    }
    return [];
  }
  const data = await res.json();
  return normalizeEventMerch(data.merch ?? data);
}

export async function createMerchOrder(
  payload: MerchOrderPayload,
  token?: string | null
): Promise<{ id: string; totalAmount: number; status: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(apiUrl('/api/merch-orders'), {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to create merch order');
  return data;
}

export async function initMerchPayment(
  orderId: string,
  callbackUrl: string,
  email: string,
  token?: string | null
): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(apiUrl('/api/merch-orders/initialize-payment'), {
    method: 'POST',
    headers,
    body: JSON.stringify({ orderId, callbackUrl, email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not start payment');
  return data.authorizationUrl || data.authorization_url || '';
}

export async function verifyMerchPayment(orderId: string, reference: string) {
  const res = await fetch(apiUrl('/api/merch-orders/verify'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, reference }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Verification failed');
  return data;
}

export async function notifyMerchManualPayment(orderId: string, email: string) {
  const res = await fetch(apiUrl('/api/merch-orders/manual-payment-notify'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, email }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Notify failed');
  }
}

export async function submitMerchSaveRequest(body: {
  eventId: string;
  merchId: string;
  fullName: string;
  email: string;
  message?: string;
}) {
  const res = await fetch(apiUrl('/api/merch-save-requests'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to submit save request');
  return data;
}
