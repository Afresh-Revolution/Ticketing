import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const plain = (value) => String(value ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
export function eventSummary(event) {
  const date = new Date(event.date);
  const day = Number.isNaN(date.getTime()) ? 'Date to be announced' : new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Africa/Lagos' }).format(date);
  const time = event.startTime || (Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos' }).format(date));
  const tickets = event.tickets ?? event.ticketTypes ?? [];
  const prices = tickets.filter(t => t.type !== 'reservation' && t.price != null && t.price !== '').map(t => t.type === 'free' ? 0 : Number(t.price)).filter(p => Number.isFinite(p) && p >= 0);
  const min = Math.min(...prices);
  const price = prices.length ? (min === 0 ? 'Free tickets available' : `Tickets from ₦${min.toLocaleString('en-NG')}`) : tickets.length && tickets.every(t => t.type === 'reservation') ? 'Reservation required' : 'View tickets';
  const title = plain(event.title) || 'GateWav event';
  const location = plain(event.location || event.venue) || 'Venue to be announced';
  return { title, day, time: plain(time), location, price, description: `${price} · ${location}. ${plain(event.description)}`.slice(0, 300) };
}
export function eventHtml(template, event, origin, id) {
  const data = eventSummary(event);
  const url = `${origin}/event/${encodeURIComponent(id)}`;
  const image = `${origin}/share-images/${encodeURIComponent(id)}.jpg`;
  const title = `${data.title} — ${data.day} · ${data.location}`;
  const meta = (key, value, name = 'property') => `<meta ${name}="${key}" content="${escape(value)}" />`;
  const tags = [meta('description', data.description, 'name'), meta('og:type', 'website'), meta('og:site_name', 'GateWav'), meta('og:title', title), meta('og:description', data.description), meta('og:url', url), meta('og:image', image), meta('og:image:type', 'image/jpeg'), meta('og:image:width', '1200'), meta('og:image:height', '630'), meta('og:image:alt', `${data.title}: ${data.day}, ${data.location}, ${data.price}`), meta('twitter:card', 'summary_large_image', 'name'), meta('twitter:title', title, 'name'), meta('twitter:description', data.description, 'name'), meta('twitter:image', image, 'name'), `<link rel="canonical" href="${escape(url)}" />`].join('\n');
  return template.replace(/<title>.*?<\/title>/s, `<title>${escape(title)}</title>\n${tags}`);
}
function lines(text, width, count) {
  const words = plain(text).split(' '); const result = []; let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > width && line) { result.push(line); line = ''; }
    line = (line + ' ' + word).trim();
  }
  if (line) result.push(line);
  return result.slice(0, count).map((s, i) => s.slice(0, width) + ((i === count - 1 && result.length > count) || s.length > width ? '…' : ''));
}
export async function eventImage(event, { imageHosts = [] } = {}) {
  const data = eventSummary(event);
  let poster;
  try {
    const url = new URL(event.imageUrls?.[0] || event.imageUrl);
    // Only approved public image services; never follow redirects to private hosts.
    if (url.protocol === 'https:' && ['res.cloudinary.com', 'images.unsplash.com', ...imageHosts].includes(url.hostname)) {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000), redirect: 'error' });
      if (!response.ok) throw new Error('Image unavailable');
      const chunks = []; let size = 0;
      for await (const chunk of response.body) { size += chunk.length; if (size > 8_000_000) throw new Error('Image too large'); chunks.push(chunk); }
      poster = await sharp(Buffer.concat(chunks), { limitInputPixels: 40_000_000 }).rotate().resize(420, 630, { fit: 'contain', background: '#102024' }).jpeg().toBuffer();
    }
  } catch { /* Branded fallback keeps the preview usable if the cover is unavailable. */ }
  const text = (value, x, y, size, color, weight = 400) => `<text x="${x}" y="${y}" font-family="DejaVu Sans, Arial, sans-serif" font-size="${size}" fill="${color}" font-weight="${weight}">${escape(value)}</text>`;
  const titleLines = lines(data.title, 25, 3);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#162629"/><rect width="420" height="630" fill="#203c40"/>${text('GateWav', 60, 330, 48, '#ecf8f4', 700)}<rect x="420" width="6" height="630" fill="#c4ef62"/>${text('GateWav', 474, 102, 30, '#c4ef62', 700)}${titleLines.map((line, i) => text(line, 474, 196 + i * 58, 45, '#ffffff', 700)).join('')}${text(`${data.day} · ${data.time}`, 474, 398, 26, '#cfdddd')}${text(lines(data.location, 41, 1)[0], 474, 440, 25, '#cfdddd')}<rect x="474" y="490" width="674" height="68" rx="15" fill="#c4ef62"/>${text(data.price, 498, 534, 28, '#162629', 700)}</svg>`;
  return sharp(Buffer.from(svg)).composite(poster ? [{ input: poster, left: 0, top: 0 }] : []).jpeg({ quality: 85 }).toBuffer();
}

export function createApp({ dist = resolve('dist'), apiBase = process.env.EVENT_API_URL || process.env.VITE_API_URL || 'https://ticketing-back.onrender.com', siteUrl = process.env.SITE_URL || 'https://gatewav.com', imageHosts = (process.env.EVENT_IMAGE_HOSTS || '').split(',').filter(Boolean), fetchEvent } = {}) {
  const origin = new URL(siteUrl).origin;
  const load = fetchEvent || (async id => {
    const response = await fetch(`${apiBase.replace(/\/$/, '')}/api/events/${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) { const error = new Error('Event unavailable'); error.status = response.status === 404 ? 404 : 503; throw error; }
    return response.json();
  });
  const cache = new Map();
  return http.createServer(async (req, res) => {
    const send = (status, type, body, cacheControl = 'no-cache') => { res.writeHead(status, { 'Content-Type': type, 'Cache-Control': cacheControl, 'X-Content-Type-Options': 'nosniff' }); res.end(req.method === 'HEAD' ? undefined : body); };
    if (!['GET', 'HEAD'].includes(req.method)) return send(405, 'text/plain', 'Method not allowed');
    try {
      const pathname = decodeURIComponent(new URL(req.url, origin).pathname);
      const match = pathname.match(/^\/(event|share-images)\/([a-zA-Z0-9_-]+?)(\.jpg)?\/?$/);
      if (match) {
        const [, kind, id, extension] = match;
        if ((kind === 'share-images') !== Boolean(extension)) return send(404, 'text/plain', 'Not found');
        const key = `${kind}/${id}`;
        let entry = cache.get(key);
        if (!entry || entry.expires < Date.now()) {
          const event = await load(id);
          const body = kind === 'event' ? eventHtml(await readFile(resolve(dist, 'index.html'), 'utf8'), event, origin, id) : await eventImage(event, { imageHosts });
          entry = { body, expires: Date.now() + 60_000 };
          if (cache.size >= 100) cache.delete(cache.keys().next().value);
          cache.set(key, entry);
        }
        return send(200, kind === 'event' ? 'text/html; charset=utf-8' : 'image/jpeg', entry.body, 'public, max-age=60');
      }
      const file = resolve(dist, '.' + pathname);
      if (file !== dist && !file.startsWith(dist + sep)) return send(403, 'text/plain', 'Forbidden');
      const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
      try { return send(200, types[extname(file)] || 'application/octet-stream', await readFile(file)); }
      catch (error) { if (!['ENOENT', 'EISDIR'].includes(error.code)) throw error; }
      if (extname(pathname) || pathname.startsWith('/share-images/')) return send(404, 'text/plain', 'Not found');
      return send(200, 'text/html; charset=utf-8', await readFile(resolve(dist, 'index.html')));
    } catch (error) { return send(error.status || 503, 'text/plain', error.status === 404 ? 'Event not found' : 'Temporarily unavailable'); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  createApp().listen(Number(process.env.PORT || 5107), '127.0.0.1', () => console.log('GateWav server listening'));
}
