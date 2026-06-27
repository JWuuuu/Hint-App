# Hint - Local Setup

This source bundle includes the app, API server, generated API packages, and database schema needed to run Hint locally or deploy it to a standard Node.js host.

## What you need installed

- Node.js 24 or current LTS Node 20+
- pnpm
- PostgreSQL database if you want profile/history/daily-pull saving to work

## Environment variables

Create a root `.env` file from `.env.example`. The API server loads this file automatically when it starts from the workspace root. Deployment hosts should use their own secret/environment variable settings instead of uploading `.env`.

Required for AI:

```bash
export OPENAI_API_KEY=your_openai_api_key_here
export OPENAI_MODEL=gpt-4o-mini
export OPENAI_TTS_MODEL=gpt-4o-mini-tts
export OPENAI_TTS_VOICE=coral
```

Required because the API imports the DB package at startup:

```bash
export DATABASE_URL=postgresql://user:password@host:5432/dbname
```

Required by the current Vite/API configs:

```bash
export API_PORT=5050   # for API terminal
export PORT=5173       # for frontend terminal
export BASE_PATH=/     # for frontend terminal
export API_PROXY_TARGET=http://localhost:5050 # for frontend terminal
export VITE_API_BASE_URL= # production only, when API is not same-origin
```

## Install

```bash
pnpm install
```

## Run locally

Terminal 1 - API:

```bash
API_PORT=5050 OPENAI_API_KEY=your_key OPENAI_MODEL=gpt-4o-mini OPENAI_TTS_MODEL=gpt-4o-mini-tts OPENAI_TTS_VOICE=coral DATABASE_URL=your_database_url pnpm run dev:api
```

Terminal 2 - Frontend:

```bash
PORT=5173 BASE_PATH=/ API_PROXY_TARGET=http://localhost:5050 pnpm run dev:web
```

Open the frontend URL printed by Vite, usually `http://localhost:5173`.

## Build

```bash
pnpm run build
```

## Deploy

Build the API service:

```bash
pnpm install --frozen-lockfile
pnpm run build:api
pnpm run start:api
```

Build the frontend static site:

```bash
pnpm install --frozen-lockfile
pnpm run build:web
```

Publish `artifacts/hint/dist/public`.

Run the database schema push once for the production database:

```bash
DATABASE_URL=your_production_database_url pnpm run db:push
```

For production, prefer routing `/api/*` from the frontend domain to the API service. If the frontend and API are deployed on separate domains, set `VITE_API_BASE_URL` during the frontend build to the API origin, for example `https://hint-api.example.com`.

## Important note

This project is intentionally a pnpm monorepo. It is already separated by package:

- `artifacts/hint` = frontend app. Deploys as static Vite output.
- `artifacts/api-server` = backend API. Deploys as a Node service.
- `lib/api-client-react` = generated React API client
- `lib/api-zod` = generated API validators
- `lib/api-spec` = OpenAPI source
- `lib/db` = database schema/client

Do not split or delete the `lib` folders unless you also replace the shared API
contract, generated client imports, and database imports. The frontend and
backend deploy separately, but they share these workspace packages.
