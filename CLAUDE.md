# jackreed.computer

Jack's personal site. Astro, fully static output, no adapter, no server side.
Served from Cloudflare Workers static assets.

## Commands

```
pnpm dev          # dev server
pnpm build        # -> dist/
pnpm preview      # wrangler dev; serves dist/ through the real Workers asset runtime
pnpm run deploy   # build + wrangler deploy (rarely needed by hand — see below)
```

`pnpm run deploy`, not `pnpm deploy` — the latter is a reserved pnpm builtin and
errors with `ERR_PNPM_CANNOT_DEPLOY`.

Use `pnpm preview`, not just `pnpm dev`, to check anything routing-related —
trailing slashes and 404 status codes only behave correctly under the Workers
runtime.

## Deploys

Pushing to `master` triggers a **Cloudflare Workers Build**, which runs
`pnpm build` then `pnpm exec wrangler deploy`. There is no GitHub Action, and
this repo is no longer on GitHub Pages.

`wrangler.jsonc` is an assets-only Worker — no `main`, no `ASSETS` binding,
because nothing here runs server-side. If you ever need on-demand rendering,
that's when `@astrojs/cloudflare` becomes necessary; until then it's not.

## Adding a page

Create `src/pages/thing.mdx`:

```mdx
---
layout: ../layouts/PageLayout.astro
title: Thing
---

Words.
```

That's the entire process — it's now live at `/thing/`. Nothing gets registered
anywhere else.

**There is deliberately no index, post list, nav, or RSS feed.** Pages are
shared by link, not browsed. Don't add a listing page, and don't link new pages
from the homepage unless explicitly asked.

## Interactivity

The reason this site is on Astro at all. Put a React component in
`src/components/`, import it into the MDX, and give it a `client:*` directive:

```mdx
import Demo from '../components/Demo.tsx';

<Demo client:visible />
```

Without a directive the component renders to static HTML and ships no JS.
Prefer `client:visible`. Islands are per-page, so **keep `/` at zero JS** —
check with `grep -c '<script' dist/index.html` after building.

`src/components/Demo.tsx` and `src/pages/hello-astro.mdx` are a working example
of the whole path; delete them once there's a real page.

## Styling

Everything is `src/styles/global.css`, including the `prefers-color-scheme:
dark` block that is the site's entire dark mode. **Test both schemes.**

`global.css` zeroes all margins and strips list markers — correct for the
homepage, wrong for prose — so `PageLayout.astro` re-adds prose styling scoped
to `.prose`. Descendants arrive via `<slot>`, so those rules need Astro's
`:global()` to reach them.

## archive/

The old pre-Astro site, kept for nostalgia. It sits at the repo root, outside
`src/` and `public/`, so Astro ignores it: not built, not served, not deployed.
`/archive/*` URLs 404 and that's intended. **Leave it alone** — don't wire it
back up, don't move it into `public/`.

## Domains

`jackreed.computer` and `www.` are custom domains on the Worker, declared in
`wrangler.jsonc`. `jackflintermann.com` 301s to `jackreed.computer` via a
zone-level Cloudflare Redirect Rule — that lives in the Cloudflare dashboard,
not in this repo, so there's no redirect code here to find.
