# Architecture

## Runtime modes

The React application uses one API contract in two environments:

1. **Local development:** Vite calls the Express API, which stores demo data in SQLite.
2. **Static hosting:** when Supabase environment variables are present, the browser uses the Supabase adapter directly.

```text
React UI
   |
   +-- local development --> Express API --> SQLite
   |
   +-- hosted demo --------> Supabase adapter --> Postgres + RLS
```

## Supabase data safety

- The visitor is signed in anonymously; there is no visible authentication screen.
- Every anonymous user owns one `workspace_state` row.
- Row-level security permits users to read, create, and update only their own row.
- A version column provides optimistic concurrency control, preventing silent overwrites between tabs.
- New workspaces are seeded from bundled synthetic demo data.

This JSON workspace model is deliberate for a small test-task prototype. A production CRM should use normalized tables, explicit audit records, role-based access, backups, and server-side Telegram delivery.

## Source layout

- `src/App.jsx` — application state, data orchestration, and screen composition.
- `src/ui-components.jsx` — product screens, dialogs, and reusable UI components.
- `src/ui-config.js` — shared display helpers, pipeline stages, and product-tour content.
- `src/api.js` — shared API entry point and local/Supabase selection.
- `src/supabase-api.js` — authenticated Supabase persistence adapter.
- `src/lib/` — pure workspace operations and tests.
- `src/data/` — synthetic workspace seed.
- `server/` — local Express and SQLite implementation.
- `supabase/` — initial hosted-demo schema and RLS policies.
