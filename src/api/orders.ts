import { apiUrl } from './config';

export interface OrderItem {
  ticketName: string;
  quantity: number;
  price: number;
  deliveryMode?: 'in_person' | 'online' | string;
}

export interface OrderEvent {
  title: string;
  description: string;
  date: string;
  endDate?: string | null;
  endTime?: string | null;
  venue: string;
  location?: string | null;
  imageUrl: string;
  category: string;
  startTime: string;
  eventType?: string;
  isLive?: boolean;
}

export interface Order {
  id: string;
  eventId: string;
  fullName: string;
  email: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  ticketCode?: string | null;
  event?: OrderEvent | null;
  items: OrderItem[];
}

function normalizeOrdersList(data: unknown): Order[] {
  if (Array.isArray(data)) return data as Order[];
  if (data && typeof data === 'object') {
    const o = data as { orders?: unknown[]; data?: unknown[] };
    if (Array.isArray(o.orders)) return o.orders as Order[];
    if (Array.isArray(o.data)) return o.data as Order[];
  }
  return [];
}

function normalizeEmail(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

/** Keep orders tied to the signed-in account email (guest purchases included). */
export function filterOrdersByEmail(orders: Order[], accountEmail: string | undefined | null): Order[] {
  const account = normalizeEmail(accountEmail);
  if (!account) return orders;
  return orders.filter((order) => {
    const orderEmail = normalizeEmail(order.email);
    return orderEmail === account;
  });
}

function normalizeOrder(raw: Record<string, unknown>): Order {
  const eventRaw = raw.event as Record<string, unknown> | null | undefined;
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];

  return {
    id: String(raw.id ?? ''),
    eventId: String(raw.eventId ?? ''),
    fullName: String(raw.fullName ?? ''),
    email: String(raw.email ?? ''),
    totalAmount: Number(raw.totalAmount) || 0,
    status: String(raw.status ?? ''),
    createdAt: String(raw.createdAt ?? ''),
    ticketCode: raw.ticketCode != null ? String(raw.ticketCode) : null,
    event: eventRaw
      ? {
          title: String(eventRaw.title ?? ''),
          description: String(eventRaw.description ?? ''),
          date: String(eventRaw.date ?? ''),
          endDate: eventRaw.endDate != null ? String(eventRaw.endDate) : null,
          endTime: eventRaw.endTime != null ? String(eventRaw.endTime) : null,
          venue: String(eventRaw.venue ?? ''),
          location: eventRaw.location != null ? String(eventRaw.location) : null,
          imageUrl: String(eventRaw.imageUrl ?? ''),
          category: String(eventRaw.category ?? ''),
          startTime: String(eventRaw.startTime ?? ''),
          eventType: String(eventRaw.eventType ?? eventRaw.event_type ?? 'in-person'),
          isLive: Boolean(eventRaw.isLive ?? eventRaw.is_live),
        }
      : null,
    items: itemsRaw.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        ticketName: String(row.ticketName ?? row.name ?? 'Ticket'),
        quantity: Number(row.quantity) || 0,
        price: Number(row.price) || 0,
        deliveryMode: String(row.deliveryMode ?? row.delivery_mode ?? 'in_person'),
      };
    }),
  };
}

export async function fetchMyOrders(token: string): Promise<Order[]> {
  const headers = { Authorization: `Bearer ${token}` };
  let res = await fetch(apiUrl('/api/user/orders'), { headers });
  if (res.status === 404) {
    res = await fetch(apiUrl('/api/orders'), { headers });
  }
  if (!res.ok) {
    throw new Error(res.status === 401 ? 'Please sign in to view your tickets.' : 'Failed to load tickets.');
  }
  const data = await res.json();
  return normalizeOrdersList(data).map((order) =>
    normalizeOrder(order as unknown as Record<string, unknown>),
  );
}
