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

export type StreamProvider = (typeof STREAM_PROVIDERS)[number]['value'];

export type StreamUrlValidationResult =
  | { valid: true; url: string }
  | { valid: false; error: string };

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
]);

const TWITCH_HOSTS = new Set([
  'twitch.tv',
  'www.twitch.tv',
  'player.twitch.tv',
  'm.twitch.tv',
]);

const EMBED_HOSTS = new Set([
  ...YOUTUBE_HOSTS,
  ...TWITCH_HOSTS,
  'vimeo.com',
  'www.vimeo.com',
  'player.vimeo.com',
  'dailymotion.com',
  'www.dailymotion.com',
]);

const BLOCKED_URL_PATTERN = /[\u0000-\u001F\u007F<>\\"'`]/;
const IPV4_HOST = /^\d{1,3}(?:\.\d{1,3}){3}$/;
const PRIVATE_HOST =
  /^(localhost|[\w-]+\.localhost|127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/i;

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, '');
}

function isPrivateOrLocalHost(hostname: string): boolean {
  if (PRIVATE_HOST.test(hostname)) return true;
  if (hostname.startsWith('[') && (hostname.includes('::1') || /^\[(?:fc|fd)/i.test(hostname))) {
    return true;
  }
  return false;
}

function validateYouTubePath(url: URL, hostname: string): boolean {
  const path = url.pathname;
  if (hostname === 'youtu.be') {
    return /^\/[\w-]{6,}$/.test(path);
  }
  if (path.startsWith('/watch')) {
    return Boolean(url.searchParams.get('v')?.trim());
  }
  if (path.startsWith('/embed/')) {
    return path.length > '/embed/'.length;
  }
  if (path.startsWith('/live/')) {
    return path.length > '/live/'.length;
  }
  return false;
}

function validateTwitchPath(url: URL, hostname: string): boolean {
  if (hostname === 'player.twitch.tv') {
    return Boolean(url.searchParams.get('channel')?.trim() || url.searchParams.get('video')?.trim());
  }
  const path = url.pathname;
  if (/^\/[\w]+$/.test(path)) return true;
  if (path.startsWith('/videos/')) return path.length > '/videos/'.length;
  return false;
}

function validateCustomEmbedUrl(parsed: URL, hostname: string): StreamUrlValidationResult {
  if (!hostname.includes('.') || hostname.length < 4) {
    return { valid: false, error: 'Use a full https URL from an approved video platform.' };
  }
  if (!EMBED_HOSTS.has(hostname)) {
    return {
      valid: false,
      error: 'Custom embed URLs must be from YouTube, Twitch, Vimeo, or Dailymotion.',
    };
  }
  return { valid: true, url: parsed.href };
}

export function validateStreamUrl(
  raw: string,
  provider: string,
  options?: { allowEmpty?: boolean },
): StreamUrlValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return options?.allowEmpty
      ? { valid: true, url: '' }
      : { valid: false, error: 'Stream URL is required.' };
  }

  if (trimmed.length > 2048 || BLOCKED_URL_PATTERN.test(trimmed)) {
    return { valid: false, error: 'Stream URL contains invalid characters.' };
  }

  const lowered = trimmed.toLowerCase();
  if (
    lowered.startsWith('javascript:') ||
    lowered.startsWith('data:') ||
    lowered.startsWith('vbscript:') ||
    lowered.startsWith('file:') ||
    lowered.startsWith('blob:') ||
    lowered.startsWith('rtmp:') ||
    lowered.startsWith('rtmps:')
  ) {
    return { valid: false, error: 'Only secure https watch or embed links are allowed.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Enter a valid URL starting with https://' };
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'Stream URL must use https:// (not http, rtmp, or other protocols).' };
  }

  if (parsed.username || parsed.password) {
    return { valid: false, error: 'Stream URL must not contain embedded credentials.' };
  }

  if (parsed.port && parsed.port !== '443') {
    return { valid: false, error: 'Stream URL must use the default HTTPS port.' };
  }

  const hostname = normalizeHostname(parsed.hostname);
  if (isPrivateOrLocalHost(hostname) || IPV4_HOST.test(hostname) || hostname.includes(':')) {
    return { valid: false, error: 'Local, private, or IP-based URLs are not allowed.' };
  }

  const providerKey = String(provider || 'youtube').toLowerCase() as StreamProvider;

  if (providerKey === 'embed') {
    return validateCustomEmbedUrl(parsed, hostname);
  }

  const allowedHosts = providerKey === 'twitch' ? TWITCH_HOSTS : YOUTUBE_HOSTS;
  if (!allowedHosts.has(hostname)) {
    const platform = providerKey === 'twitch' ? 'Twitch' : 'YouTube';
    return { valid: false, error: `URL must be a ${platform} watch or embed link.` };
  }

  const pathValid =
    providerKey === 'twitch'
      ? validateTwitchPath(parsed, hostname)
      : validateYouTubePath(parsed, hostname);

  if (!pathValid) {
    return {
      valid: false,
      error:
        providerKey === 'twitch'
          ? 'Use a Twitch channel link or player embed URL.'
          : 'Use a YouTube watch, live, or embed link (not an RTMP ingest URL).',
    };
  }

  return { valid: true, url: parsed.href };
}
