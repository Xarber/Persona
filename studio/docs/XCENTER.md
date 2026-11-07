# X-Center staging and deployment plan

X-Center is Persona's default hosting target. This is a prepared configuration, **not a deployment**. No X-Center account, hostname, reverse proxy or existing service has been inspected or modified in this task.

## Existing infrastructure first

Before executing anything on X-Center, identify the current Persona deployment (if any), commit, image digest, volumes, database, available ports, disk space, proxy software and TLS management. Reuse a confirmed existing project; never create a parallel production deployment simply because its name is unfamiliar. Record a rollback path and back up database and uploads together. Use separate staging data.

The additive overlay `infra/xcenter.compose.yaml` keeps the bundled Caddy proxy behind the inactive `standalone-proxy` profile. The application binds only loopback ports 18130/18131 by default. Confirm those ports are free or set PERSONA_APP_PORT/PERSONA_PUBLIC_PORT. No database port is exposed. Do not enable the standalone proxy alongside an existing proxy using 80/443.

## Prepare an isolated candidate

From `studio/`, create a protected `.env` from `.env.example`. Configure APP_HOST and SITES_HOST as distinct approved hostnames, strong PostgreSQL credentials, REGISTRATION_OPEN=false and the exact BUILD_COMMIT. ACME_EMAIL remains required by base Compose interpolation, even though the bundled proxy is inactive; use the operator's configured contact. Never commit the resulting file. UPDATE_REPOSITORY may be set to `Xarber/Persona` when an authorized application release channel exists; this does not activate one.

After deployment authorization, validate configuration and start an isolated staging project:

```sh
docker compose -p persona-stage -f compose.yaml -f infra/xcenter.compose.yaml config --quiet
docker compose -p persona-stage -f compose.yaml -f infra/xcenter.compose.yaml up -d --build database app worker
```

These are operator instructions, not commands executed by this task. Changing the project name creates distinct volumes: deliberately map existing production volumes only during an approved migration. Do not use `down -v`.

## Proxy contract

The existing trusted host proxy must route the approved editor hostname to loopback app port 18130 and the separate portfolio hostname to public port 18131. Preserve Host and set trusted forwarding headers, stripping untrusted incoming values. Do not forward account cookies to the public origin. Keep private artifacts off shared static directories. If the proxy runs in a container, loopback on the host is not that container's loopback: prepare a restricted supported network connection before enabling routing; do not expose these ports on all interfaces as a shortcut.

Custom portfolio hostnames require the ownership/routing/ACME checks in [Domains](DOMAINS.md). The overlay does not configure arbitrary-domain TLS in an unknown existing proxy. Keep this feature inactive until its exact integration has been validated. Never replace global proxy configuration or restart unrelated healthy services.

## Acceptance and rollback

Verify `/api/health` reports the intended commit/version, then test login, create/edit/save, upload, publishing through the public listener, a real form submission, export, worker recovery, offline shell, root first-visit landing and remembered application entry over staging HTTPS. Verify publicly served version and separate-origin cookie behavior. Execute PostgreSQL backup/restoration and Docker health checks; local SQLite and Chromium tests are insufficient evidence.

Only promote the validated image after deployment authorization. Preserve the previous image, protected configuration and consistent backup. Roll back this application's image and compatible data snapshot if critical checks fail. Never restore by deleting user data. Record actual host, version, commit, checks, logs and rollback outcome in the release report.
