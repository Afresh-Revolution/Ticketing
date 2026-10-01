/**
 * Paystack appends `reference` / `trxref` to callback_url as a normal query string.
 * This app uses HashRouter, so `/#/payment-success?orderId=...` puts our params
 * inside the hash. Paystack then returns:
 *   https://gatewav.com/?reference=...&trxref=...#/payment-success?orderId=...
 * or drops the hash entirely. Lift those params into the hash route before React mounts.
 */

const TRIGGER_KEYS = ['reference', 'trxref', 'orderId'] as const;

export function buildPaystackCallbackUrl(query: Record<string, string | number | undefined | null>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === '') continue;
    params.set(key, String(value));
  }
  return `${window.location.origin}/?${params.toString()}`;
}

export function capturePaystackReturn(): void {
  if (typeof window === 'undefined') return;

  const search = new URLSearchParams(window.location.search);
  const hasReturn = TRIGGER_KEYS.some((key) => search.has(key));
  if (!hasReturn) return;

  const hashRaw = (window.location.hash || '').replace(/^#/, '');
  const qIndex = hashRaw.indexOf('?');
  const hashQuery = qIndex >= 0 ? hashRaw.slice(qIndex + 1) : '';
  const merged = new URLSearchParams(hashQuery);
  search.forEach((value, key) => {
    if (!merged.has(key)) merged.set(key, value);
  });

  const next = `${window.location.pathname}#/payment-success?${merged.toString()}`;
  window.history.replaceState(null, '', next);
}
