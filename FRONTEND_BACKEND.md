# Hint Frontend / Backend Boundary

Hint should stay in one repo, but the code should be treated as separate
deployable packages.

## Frontend

- Package: `@workspace/hint`
- Path: `artifacts/hint`
- Runtime: Vite + React
- Local command: `pnpm run dev:web`
- Build command: `pnpm run build:web`
- Production output: `artifacts/hint/dist/public`
- Deploy target: Vercel

Frontend code should call APIs through the generated React client or through
same-origin `/api/*` routes. In production, Vercel rewrites `/api/*` to the API
service.

## Backend

- Package: `@workspace/api-server`
- Path: `artifacts/api-server`
- Runtime: Node + Express
- Local command: `pnpm run dev:api`
- Build command: `pnpm run build:api`
- Start command: `pnpm run start:api`
- Deploy target: Render

Backend code owns OpenAI calls, database writes, speech endpoints, and anything
that needs secrets. The frontend should not receive API keys.

## Shared Packages

- `lib/api-spec` - API source contract
- `lib/api-zod` - API validators
- `lib/api-client-react` - frontend API client
- `lib/db` - database schema/client

These packages are the reason this should remain a monorepo. They keep frontend
and backend changes in sync without publishing packages or copying types.

## Deploy Flow

1. Render deploys the backend with `pnpm run build:api` and `pnpm run start:api`.
2. Render runs `pnpm run db:push` before starting the API.
3. Vercel deploys the frontend with `pnpm run build:web`.
4. Vercel routes `/api/*` to the Render API service.

If the API host changes, update the `/api/:path*` rewrite in `vercel.json`.
