# Aurum Galleria Indoor Navigation

Production-oriented mall kiosk, mobile continuation and operations dashboard built with TanStack Start, React, Tailwind CSS and Lovable Cloud.

## Run locally

```bash
bun install
bun run dev
```

Backend credentials are managed securely by Lovable Cloud. Do not commit private service credentials. The application includes email/password and managed Google authentication, row-level access rules, leaked-password protection, and role assignments (`super_admin`, `admin`, `content_manager`).

## Main routes

- `/` — vertical touch kiosk welcome and categories
- `/category/:slug` — searchable/filterable directory
- `/destination/:storeId` — destination confirmation
- `/navigate/:storeId` — animated indoor route and QR continuation
- `/route/:sessionId` — responsive, installable offline-capable mobile route
- `/admin` — authenticated operations dashboard and map-editor preview
- `/api/*` — validated REST API for stores, categories, kiosks, route finding and 30-minute sessions

## Navigation model

The A* engine is in `src/lib/navigation-engine.ts`. Nodes include coordinates and floor level; edges include distance, directionality, connector type, and accessibility. Floor changes carry a heuristic cost and inaccessible edges are removed for accessible routes.

## Deployment

Use Lovable Publish for the frontend and server routes. Database migrations and backend configuration deploy through Lovable Cloud. The generated service worker is disabled in development and editor previews, excludes OAuth callbacks, uses network-first navigation caching, and activates only on the published site.