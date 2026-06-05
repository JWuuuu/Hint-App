# Cleanup Report

Removed from the source bundle:

- prior Git history
- local package-manager cache/state data
- editor and development-environment cache data
- host-specific configuration files
- unused sandbox artifacts
- generated API server build output
- prompt screenshots/design references not imported by the app
- development-only post-merge hooks

Kept source needed to build/run:

- root package/workspace files
- `.env.example`
- frontend app: `artifacts/hint`
- API server: `artifacts/api-server`
- API client/spec/zod libs
- DB schema/client lib
- TypeScript config and lockfile
