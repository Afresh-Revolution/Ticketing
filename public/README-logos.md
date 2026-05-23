# Logo assets

| File | Use |
|------|-----|
| **logo.png** | G mark — source for `npm run generate-icons` (favicons & PWA) |
| **src/assets/branding/** | Wordmark + icon used in the app (Vite hashed URLs, not cached stale paths) |

After updating `logo.png`, regenerate sized icons and bump `BRAND_ASSET_VERSION` in `src/branding/version.ts`:

```bash
npm run generate-icons
```

Generated files (do not edit by hand): `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`.
