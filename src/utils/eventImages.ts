export const MAX_EVENT_IMAGES = 3;

export const DEFAULT_EVENT_IMAGE =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80';

export function parseStoredEventImages(
  imageUrls?: string[] | null,
  imageUrl?: string | null,
): string[] {
  const fromArray = Array.isArray(imageUrls)
    ? imageUrls.map((u) => String(u || '').trim()).filter(Boolean)
    : [];
  if (fromArray.length > 0) {
    return fromArray.slice(0, MAX_EVENT_IMAGES);
  }
  const single = String(imageUrl || '').trim();
  return single ? [single] : [];
}

export function resolveEventImages(
  imageUrls?: string[] | null,
  imageUrl?: string | null,
): string[] {
  const stored = parseStoredEventImages(imageUrls, imageUrl);
  if (stored.length > 0) return stored;
  return [DEFAULT_EVENT_IMAGE];
}

export function primaryEventImage(
  imageUrls?: string[] | null,
  imageUrl?: string | null,
): string {
  return resolveEventImages(imageUrls, imageUrl)[0];
}
