export type TicketCategory = 'paid' | 'free' | 'reservation';

export interface TicketLike {
  type?: string | null;
  price?: number | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

export function normalizeTicketType(ticket: TicketLike): TicketCategory {
  const raw = String(ticket.type ?? '').toLowerCase().trim();
  if (raw === 'reservation') return 'reservation';
  if (raw === 'free') return 'free';
  if (raw === 'paid') return 'paid';
  const price = Number(ticket.price) || 0;
  return price === 0 ? 'free' : 'paid';
}

export function isReservationEvent(tickets: TicketLike[]): boolean {
  return tickets.length > 0 && tickets.every((t) => normalizeTicketType(t) === 'reservation');
}

export function reservationContacts(tickets: TicketLike[]) {
  const seen = new Set<string>();
  const rows: { name?: string; email?: string; phone?: string }[] = [];
  for (const t of tickets) {
    if (normalizeTicketType(t) !== 'reservation') continue;
    const email = String(t.contactEmail ?? '').trim();
    const phone = String(t.contactPhone ?? '').trim();
    const key = `${email}|${phone}`;
    if (!email && !phone) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ email: email || undefined, phone: phone || undefined });
  }
  return rows;
}
