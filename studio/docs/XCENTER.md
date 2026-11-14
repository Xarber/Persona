# X-Center staging and deployment plan

X-Center hosts the public Persona studio at https://persona.xcenter.it. Published portfolios use https://persona-sites.xcenter.it. The historical staging guidance below describes the standalone Compose profile. See the public appliance section for the active deployment.

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

## Public appliance deployment

The public appliance profile is `infra/xcenter-appliance.compose.yaml`. It runs one non-root Node 24 container with a dedicated SQLite database, an embedded publishing worker and two loopback listeners. Persistent data lives in `/srv/xcenter/data/persona`. Keep one replica and take a consistent backup of that directory before each upgrade.

Set `BUILD_COMMIT` to the checked-out SHA. `PERSONA_APP_ORIGIN` and `PERSONA_PUBLIC_ORIGIN` override the two configured HTTPS origins. Browser API calls use the editor origin automatically. The Docker build compiles out the developer entry point using `PERSONA_HOSTED=true`. This profile also disables custom domain creation because the shared Nginx ingress only routes the two configured hosts. The standalone Caddy profile retains its separate domain workflow.

Build the candidate from an archived commit under `/srv/xcenter/apps/persona/releases/<sha>/`. Validate both loopback listeners before installing `infra/xcenter-nginx.conf` in the appliance's existing vhost include directory. Use `nginx -t` before a graceful reload. Keep the previous image and a consistent data backup for upgrades. To withdraw the initial deployment, remove the Persona-only vhost, validate/reload Nginx, and stop the Persona Compose project while retaining its data.

## Deployment verification — 14 November 2026

- The appliance built and started Persona 0.1.0 from commit `998b4ebcf25d5c93a5ed009bec2452c0da795017`. The image manifest digest is `sha256:076dac3f9f1f2921c33d3a49de0a29ec8d90b696a6c132cb0818a3b027899f90`.
- The container passed its loopback health check. Nginx configuration validation and graceful reload passed. The public HTTPS health route returned the exact build commit. Fieldplay remained reachable after reload.
- Chrome against the public endpoints passed landing entry, hosted Settings, registration, template creation, image upload, save, publishing on the separate origin, contact submission and ZIP export. The synthetic test account was removed and its published URL returned 404.
- Local type check, 39 Vitest tests and 10 Chrome tests passed. The hosted profile also passed a separate Settings smoke test.
- The initial build stalled with the system disk full. The retry succeeded after space became available. The appliance reported only 46 MiB available on its root filesystem immediately after startup. Free capacity before another build. No unrelated Docker images, volumes or service data were removed.
- Native Expo output remains a starter, so no Persona IPA/APK workflow or artifact applies. Physical devices, full PWA upgrade, backup restoration and custom-domain routing are outside this verification.
