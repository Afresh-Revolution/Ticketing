import { apiUrl } from './config';

export interface OrderItem {
  ticketName: string;
  quantity: number;
  price: number;
}

export interface OrderEvent {
  title: string;
  description: string;
  date: string;
  venue: string;
  imageUrl: string;
  category: string;
  startTime: string;
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
  return normalizeOrdersList(data);
}
