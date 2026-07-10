# Contributing

This repository is a focused test-task prototype. Keep changes small, explain product trade-offs, and avoid introducing production claims into simulated features.

## Local workflow

1. Use Node.js `22.12.0` or newer.
2. Install dependencies with `npm ci`.
3. Create a focused branch.
4. Run `npm run check` before opening a pull request.

Do not commit `.env` files, local SQLite databases, real client information, or Supabase service-role keys.
