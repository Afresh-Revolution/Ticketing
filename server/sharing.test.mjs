import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { createApp, eventHtml, eventImage, eventSummary } from './index.mjs';
const event = { title: 'The Playground <script>', date: '2026-11-29T11:00:00Z', location: 'Rayfield, Jos', description: '<b>A social bazaar</b>', tickets: [{ price: '5000' }, { price: 10000 }] };
test('metadata is in initial HTML, escaped, with clean canonical URLs', () => {
  const html = eventHtml('<html><head><title>GateWav</title></head></html>', event, 'https://gatewav.com', 'abc');
  assert.match(html, /og:title/);
  assert.match(html, /Tickets from ₦5,000/);
  assert.match(html, /https:\/\/gatewav.com\/share-images\/abc.jpg/);
  assert.doesNotMatch(html, /<script>|<b>/);
  assert.match(html, /Sun,? 29 Nov/);
});
test('free, reservation and unknown prices are distinct', () => {
  assert.equal(eventSummary({ tickets: [{ price: 0 }] }).price, 'Free tickets available');
  assert.equal(eventSummary({ tickets: [{ type: 'reservation', price: 0 }] }).price, 'Reservation required');
  assert.equal(eventSummary({ tickets: [{ price: null }] }).price, 'View tickets');
});
test('preview is a 1200 by 630 JPEG even without a cover', async () => {
  const metadata = await sharp(await eventImage(event)).metadata();
  assert.equal(metadata.format, 'jpeg');
  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 630);
});
test('HTTP serves metadata without JavaScript and handles missing events and HEAD', async () => {
  const server = createApp({ fetchEvent: async id => { if (id === 'missing') throw Object.assign(new Error(), { status: 404 }); return event; } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const response = await fetch(`${base}/event/abc?ref=tracking`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /property="og:title"/);
    assert.equal((await fetch(`${base}/event/missing`)).status, 404);
    const head = await fetch(`${base}/share-images/abc.jpg`, { method: 'HEAD' });
    assert.equal(head.headers.get('content-type'), 'image/jpeg');
    assert.equal(await head.text(), '');
    assert.equal((await fetch(`${base}/missing.js`)).status, 404);
    assert.equal((await fetch(`${base}/event/abc`, { method: 'POST' })).status, 405);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
