# Project AGAP

Production-oriented MVP for AI-Guided Assessment and Prioritization in Lucena City. The existing dashboard design is preserved; its workflows are backed by Next.js route handlers, Supabase/PostGIS, deterministic TypeScript engines, and an IndexedDB synchronization queue.

Start with [SETUP.md](SETUP.md). Architecture and API references are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/API.md](docs/API.md).

```bash
cp .env.example .env.local
npm install
npm run test
npm run dev
```

All bundled records are explicitly synthetic demonstration data and must not be used as official disaster information.
