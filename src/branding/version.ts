/** Bump when logo or favicon assets change — busts CDN/browser/PWA caches on deploy. */
export const BRAND_ASSET_VERSION = 'gw-gateway-2026-05';

export function brandAssetUrl(path: string): string {
  const base = path.startsWith('/') ? path : `/${path}`;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}v=${encodeURIComponent(BRAND_ASSET_VERSION)}`;
}
