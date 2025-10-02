# Permanent Migration to me.databayt.org

## Migration Status: ✅ COMPLETE

The platform has been permanently migrated from `ed.databayt.org` to `me.databayt.org`.

## What Changed

### Domain Behavior
- **me.databayt.org** → Marketing/landing page (primary domain)
- **ed.databayt.org** → Permanently redirects to me.databayt.org (301 redirect)
- **[school].databayt.org** → Tenant sites (unchanged)

### Implementation
1. **Middleware** (`src/middleware.ts`)
   - Always redirects ed.databayt.org to me.databayt.org
   - Only recognizes me.databayt.org as marketing domain
   - No rollback option - permanent migration

2. **Subdomain Logic** (`src/lib/subdomain.ts`)
   - Only `me` is treated as special marketing subdomain
   - `ed` is now a regular subdomain (but redirected by middleware)

3. **Configuration** (`src/config/domains.ts`)
   - Simplified to only support me.databayt.org
   - Removed all transition/rollback logic

## Required Actions

### Immediate
- [x] Code deployed with permanent redirect
- [ ] DNS records for me.databayt.org configured
- [ ] SSL certificate for me.databayt.org active

### OAuth Updates
Update redirect URLs in provider consoles:
- **Google**: `https://me.databayt.org/api/auth/callback/google`
- **Facebook**: `https://me.databayt.org/api/auth/callback/facebook`

### Marketing Updates
- Update all links to use me.databayt.org
- Update email templates
- Update business cards/materials
- Update social media profiles

## How It Works

```
User visits ed.databayt.org
    ↓
Middleware intercepts request
    ↓
301 Permanent Redirect
    ↓
User lands on me.databayt.org
```

All old links, bookmarks, and search engine results will automatically redirect to the new domain, preserving SEO value through 301 permanent redirects.

## No Rollback

This is a permanent migration. The ed.databayt.org domain will always redirect to me.databayt.org. There is no configuration option to disable this redirect.