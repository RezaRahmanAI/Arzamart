# ECommerce View

Angular 18 frontend for the Arza e-commerce platform.

## Development

```bash
npm install
npm start        # serves with SSL on https://localhost:4200
npm run build    # production build
npm test         # unit tests
npm run lint     # lint
npm run typecheck
npm run format   # prettier
```

## Environment

Edit `src/environments/environment.ts` to set `apiBaseUrl` for the backend API.

## Structure

- `src/app/core/` — Singleton services, HTTP client, shared models
- `src/app/shared/` — Reusable UI components
- `src/app/features/` — Public pages (home, products, cart, checkout, orders)
- `src/app/admin/` — Admin dashboard (orders, products, customers, analytics)
- `src/app/layout/` — Navbar, footer
