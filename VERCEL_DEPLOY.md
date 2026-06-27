# Deploy frontend to Vercel

Use Vercel for the public website. Keep the API and database on a backend host such as Render.

## What to deploy

Deploy the repository root, not `artifacts/hint`.

The Vercel project should use:

| Setting | Value |
| --- | --- |
| Framework Preset | Vite |
| Root Directory | repo root |
| Install Command | `corepack enable && corepack prepare pnpm@10.25.0 --activate && pnpm install --frozen-lockfile` |
| Build Command | `pnpm run build:web` |
| Output Directory | `artifacts/hint/dist/public` |

These are already saved in `vercel.json`.

## API

The current Vercel config proxies:

```text
/api/* -> https://mydailyhint-api.onrender.com/api/*
```

That means the frontend can call `/api/...` from `mydailyhint.com`, while the actual API runs on Render.

If you deploy the API somewhere else, update the `/api/:path*` destination in `vercel.json`.

## Domain

After the Vercel deployment works:

1. Open the Vercel project.
2. Go to **Settings > Domains**.
3. Add `mydailyhint.com`.
4. Add `www.mydailyhint.com`.
5. Copy the DNS records Vercel shows into your domain registrar.

Vercel will issue HTTPS automatically after DNS verifies.
