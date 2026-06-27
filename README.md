# Hint

Hint is a Vite React frontend with a Node/Express API, generated API clients,
and a Postgres-backed Drizzle schema.

## Code layout

This repo stays as one pnpm workspace, but the app is organized as separate
frontend and backend packages:

- `artifacts/hint` - frontend React/Vite app.
- `artifacts/api-server` - backend Node/Express API.
- `lib/api-spec`, `lib/api-zod`, `lib/api-client-react` - shared API contract,
  validators, and generated frontend client.
- `lib/db` - shared database schema/client.

Keeping these packages in one workspace avoids frontend/backend drift while
still allowing separate deploys.

## Common commands

```bash
pnpm run dev:web      # frontend only
pnpm run dev:api      # backend only
pnpm run build:web    # frontend production build
pnpm run build:api    # backend production build
pnpm run typecheck    # whole workspace
```

## Deploy shape

- Frontend deploys to Vercel from `artifacts/hint/dist/public`.
- Backend deploys to Render as `mydailyhint-api`.
- Frontend `/api/*` is routed to the backend API.

See [LOCAL_SETUP.md](LOCAL_SETUP.md) for local setup and deployment notes.
