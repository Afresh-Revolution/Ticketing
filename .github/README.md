# GitHub Actions

## Purge Cloudflare after deploy

When you **push to `main`**, the workflow waits for DigitalOcean App Platform to deploy, then **purges Cloudflare cache** so visitors see your new version right away.

### One-time setup

1. **Cloudflare Zone ID**  
   Cloudflare Dashboard → your domain → **Overview** → copy **Zone ID** (right sidebar).

2. **Cloudflare API token**  
   - [Create API token](https://dash.cloudflare.com/profile/api-tokens) → **Create Token**  
   - Use template **“Edit zone cache”** or custom: **Zone** → **Cache Purge** → **Purge**  
   - Copy the token.

3. **GitHub secrets**  
   Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:
   - `CLOUDFLARE_ZONE_ID` = Zone ID from step 1  
   - `CLOUDFLARE_API_TOKEN` = token from step 2  

After that, every push to `main` will automatically purge the cache once the deploy is done. You can also run **Actions** → **Purge Cloudflare after deploy** → **Run workflow** to purge manually.
