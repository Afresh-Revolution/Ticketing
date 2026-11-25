# Event link previews

Production runs `server/index.mjs` through `ecosystem.config.cjs` on port 5107. It serves the Vite build, `/event/:id` HTML with Open Graph metadata, and `/share-images/:id.jpg` preview images. Share buttons now send links instead of photo attachments. Legacy hash links still open, but cannot provide event-specific previews.

The 1200 × 630 JPEG includes the poster, title, Lagos-local date/time, venue, and lowest listed ticket price. Reservation-only events are labelled separately. Messaging apps control the final preview layout.

## Configuration

The production process loads `.env` using Node 22:

- `SITE_URL`: public frontend origin; defaults to `https://gatewav.com`.
- `EVENT_API_URL`: public backend origin; falls back to `VITE_API_URL`, then the existing Render backend.
- `EVENT_IMAGE_HOSTS`: optional comma-separated trusted public poster-storage hostnames. Cloudinary and Unsplash are enabled by default. Other hosts use a branded fallback until allowlisted. Image redirects are not followed.

Nginx must proxy `/event/` and `/share-images/` to `http://127.0.0.1:5107`, or proxy the whole site there. If Nginx serves `dist` directly, add these locations to the existing site server block:

```nginx
location ^~ /event/ {
    proxy_pass http://127.0.0.1:5107;
}
location ^~ /share-images/ {
    proxy_pass http://127.0.0.1:5107;
}
```

The live Nginx configuration is not in this checkout and must be verified on the VPS. The GitHub deployment workflow replaces the existing static PM2 process with this server.

## Verification

Run `npm run build`, `npm run test:sharing`, then `npm start`. Confirm an actual `/event/:id` response contains event-specific `og:title` and `og:image` without JavaScript, and that its image URL returns `image/jpeg`.

After deployment, share a new clean event URL in WhatsApp. Previously sent messages may retain cached previews. A preview is not guaranteed by every messaging app or privacy setting.
