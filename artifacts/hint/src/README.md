# Frontend Source Layout

Hint's frontend is an app-first React surface. Keep new work inside the narrowest owner that matches the behavior.

- `App.tsx` owns top-level providers and legacy redirects into `/app`.
- `product/ProductRouter.tsx` owns app route registration only. Do not put feature screens or product implementations under `product`.
- `modules/<feature>` owns feature screens, feature-local components, feature data, and feature logic.
- `components/app` owns app shell and app-wide chrome.
- `components/ui` owns generic primitive UI components.
- `shared` owns cross-feature helpers that are intentionally reused by multiple modules.
- `lib` owns app services, persistence helpers, API wrappers, and non-React domain utilities.

Before adding a new folder, check whether the feature already has a module. Prefer replacing or extending the existing owner over creating a parallel implementation.
