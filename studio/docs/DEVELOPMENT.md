# Development

Use Node 24+ and the committed npm lockfile. Installed baseline: React 19.3.1, TypeScript 5.9.3, Vite 7.3.7, Express 5.3.0, Zod 4.6.7, dnd-kit core 6.3.1/sortable 10.0.0, sharp 0.35.5, SimpleWebAuthn server 14.0.3/browser 14.0.0, PostgreSQL driver 8.23.1. Recheck the lockfile before integration changes. Node's SQLite API is available in Node 24 but may print an experimental warning.

```sh
npm ci
cp .env.example .env
npm run migrate
npm run dev
```

The server loads `.env` when present. Defaults are editor `http://localhost:3100`, public delivery `http://localhost:3101`, and storage `.data`. Set `DATABASE_URL` for PostgreSQL; leave it unset for SQLite. Set `PORT`/`PUBLIC_PORT` together with their matching origins if ports change. All API mutations verify the exact APP_ORIGIN.

```sh
npm run check
npm test
npm run build
npm run test:e2e
```

`npm run build` typechecks, exports the Vite application and generates a content-versioned service worker. Production startup requires separate APP_ORIGIN/PUBLIC_ORIGIN. `BUILD_COMMIT` is embedded into client diagnostics and returned by the health API; use an exact commit SHA for reproducible outputs.

The default server runs one embedded publisher. To separate it, set EXTERNAL_WORKER=true for the server, and run `npm run worker` in another process with identical DATABASE_URL/DATA_DIR. Only one worker should run. `npm run export -- SITE_ID output.zip` is an operator command using the configured database and assets.

SVG masters are in `public/branding`; `npx tsx scripts/branding.ts` regenerates relevant PNG exports. The core application needs no downloaded web font. Never edit `.data` or commit exports containing personal content. Browser test accounts/media are isolated under `.data/e2e`, while unit/integration tests use a disposable temporary directory.
