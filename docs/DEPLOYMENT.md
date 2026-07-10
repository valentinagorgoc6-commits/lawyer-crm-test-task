# Hosted demo setup

## Supabase

1. Create a Supabase project.
2. Enable anonymous sign-ins in the Authentication settings.
3. Open the SQL editor and run `supabase/setup.sql`.
4. Copy `.env.example` to `.env.local`.
5. Add the project URL and the publishable key. Never use the service-role key.
6. Run `npm run check`.

The SQL script replaces the legacy shared demo table. If an older demo schema contains anything worth keeping, export it before running the script.

## Static hosting

Build the app with:

```bash
npm ci
npm run build
```

Upload the contents of `dist/` to the document root. Configure the web server to serve `index.html` for unknown frontend routes.

After deployment, verify:

- the dashboard loads without a sign-in screen;
- refreshing the page preserves changes;
- another private browser window receives a separate demo workspace;
- client CRUD and Telegram reminder simulation work;
- no `.env.local`, SQLite database, or service-role key is present in the public files.
