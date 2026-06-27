# Deploy `mydailyhint.com` on Render

Use this only if Render is hosting the website too. If the website is hosted on Vercel, use `VERCEL_DEPLOY.md` instead and keep Render for only the API and database.

This app has three production pieces:

- `mydailyhint-web`: the static React site
- `mydailyhint-api`: the Node API server
- `mydailyhint-db`: the production Postgres database

## 1. Push the repo to GitHub

Render deploys from a Git repository. Push this workspace to GitHub before creating the Blueprint.

## 2. Create the Render services

1. Open Render and choose **New > Blueprint**.
2. Select this GitHub repo.
3. Render will read `render.yaml`.
4. When Render asks for `OPENAI_API_KEY`, paste the production OpenAI API key.
5. Create the Blueprint.

Render will create:

- `mydailyhint-api`
- `mydailyhint-db`

## 3. Database schema

`render.yaml` runs `pnpm run db:push` before the API starts, so the production tables are created during deploy.

## 4. Connect the domain

If you want Render to host the website instead of Vercel, create a Render static site and add these domains:

- `mydailyhint.com`
- `www.mydailyhint.com`

In the Render dashboard, open `mydailyhint-web` and check **Settings > Custom Domains**. Render will show the exact DNS records to add at your domain registrar.

Typical records look like this:

| Host | Type | Value |
| --- | --- | --- |
| `www` | `CNAME` | the Render target shown in the dashboard |
| `@` | `ALIAS`, `ANAME`, flattened `CNAME`, or `A` records | the Render target shown in the dashboard |

Use the exact values Render gives you. DNS can take a few minutes to several hours to finish.

## 5. Verify

Check these URLs:

- `https://mydailyhint.com`
- `https://www.mydailyhint.com`
- `https://mydailyhint-api.onrender.com/api/healthz`

If the frontend loads but AI calls fail, check the `OPENAI_API_KEY` and API service logs in Render.
