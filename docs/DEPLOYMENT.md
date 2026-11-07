# Self-hosting and recovery

## Docker Compose

The prepared stack contains Node application, a single publishing worker, PostgreSQL 17, filesystem asset/artifact volume and Caddy 2. No Redis or proprietary service is required. There is no S3 adapter in this version. Set at least the following in `.env` before starting:

```dotenv
APP_HOST=studio.example.com
SITES_HOST=sites.example.net
POSTGRES_PASSWORD=replace-with-a-long-url-safe-random-secret
ACME_EMAIL=operator@example.com
REGISTRATION_OPEN=false
```

Use DNS you control. Keep the editor and public origins separate; using separate registrable domains gives stronger browser isolation. Only the proxy exposes ports 80 and 443; database/app ports stay inside the Compose network. Secrets belong in your protected environment or secret-management system, never Git. URL-encode credentials if using characters with special meaning in DATABASE_URL.

```sh
docker compose config
docker compose up -d --build
docker compose exec app npm run migrate
docker compose logs --tail=100 app worker proxy
```

Migration is idempotent and runs at process startup. Set REGISTRATION_OPEN=true temporarily for initial account creation when appropriate, then close it. Optional SMTP_URL and MAIL_FROM enable verification/reset emails; their credentials never reach published websites. The app's unprivileged container user must own `/data`. Never scale the worker beyond one replica with the current crash-requeue protocol.

## Production release procedure

1. Record the current image digest, source commit and environment. Back up database and `/data` together.
2. Build a candidate image with BUILD_COMMIT set to the exact source SHA. Validate it in an isolated staging stack.
3. Run schema checks, API health and a complete create/edit/publish/export workflow using disposable staging data.
4. Preserve the old image and volume/database backup. Replace only this application's containers; do not restart unrelated services.
5. Verify `/api/health` version/commit, authentication, a real published page, form submission, media, worker and custom hostname HTTPS.
6. Monitor immediate logs. Roll back the image and compatible database/data snapshot if essential verification fails. Never use `docker compose down -v` for routine upgrades.

No production instance has been replaced as part of this task. Container runtime, PostgreSQL service, public DNS and ACME evidence must be recorded after actual execution; a successful TypeScript build does not verify the stack.

## Backups and deletion

For PostgreSQL use `pg_dump` (inside the database container if appropriate) and preserve the matching data volume. For SQLite stop application writes and copy the SQLite database with its consistent WAL state, or use SQLite's backup API; copying only a live main database file can be inconsistent. Encrypt backups and test restoration on an isolated stack.

The data volume contains uploads (processed plus original), deployment directories and local SQLite when configured. Database deletion immediately revokes authenticated/public access; physical orphaned files and backups require a deliberate operator retention/cleanup procedure. Never remove assets still referenced by a revision or deployment. Form submissions and aggregate analytics expire after 90 days while maintenance runs; expired sessions/challenges are removed. Monitor disk usage and storage quota enforcement.
