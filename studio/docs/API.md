# API contract, version 1

The `/api` prefix currently exposes contract version 1. JSON requests/responses use the shared TypeScript/Zod schemas. Future breaking changes require a versioned route or explicit migration; do not silently reuse these fields for incompatible behavior.

Every private route verifies an HttpOnly session and row ownership. Every mutation requires `Origin: APP_ORIGIN`, including multipart uploads. Public forms and certificate authorization live on the separate public listener. Errors use `{error: string}` with 400 validation, 401 session, 403 origin/permission, 404 absent/not-owned, 409 version conflict and 500 unexpected failures. Successful API responses are no-store.

| Method | Route | Contract |
| --- | --- | --- |
| GET | `/api/health`, `/api/config` | Version/commit/schema and non-secret public configuration |
| POST | `/api/auth/register`, `/api/auth/login` | `{email,password}`; minimum 12-character password; sets host-only cookie |
| GET | `/api/auth/me`, `/api/auth/sessions`, `/api/auth/status` | Account identity, own sessions, email/passkey state |
| POST/DELETE | `/api/auth/logout`, `/api/auth/sessions/:id` | Revoke current/own session |
| POST | `/api/auth/verification/request`, `/confirm` | SMTP-enabled request; confirm `{token}` |
| POST | `/api/auth/password/request`, `/reset` | Request `{email}`; reset `{token,password}` and revoke sessions |
| POST | `/api/auth/passkeys/register/options`, `/verify` | Authenticated WebAuthn registration; response plus one-use challenge ID |
| POST | `/api/auth/passkeys/login/options`, `/verify` | Discoverable passkey authentication with origin/RP/counter checks |
| DELETE | `/api/auth/passkeys/:id` | Remove own credential |
| GET/POST | `/api/websites` | List own sites; create `{name,template,person?,document?}` |
| GET/PATCH/DELETE | `/api/websites/:id` | PATCH `{version,document?,archived?}`; DELETE `{confirm: exactName}` |
| GET | `/api/websites/:id/revisions`, `/:revision` | Revision list or validated document |
| POST | `/api/websites/:id/publish` | `{version}` must match saved draft; returns 202 job ID |
| POST | `/api/websites/:id/unpublish` | Clear publication; cannot race an active building job |
| GET | `/api/websites/:id/deployments` | IDs, versions, states, logs and timestamps |
| POST | `/api/websites/:id/deployments/:deployment/rollback` | Select a ready artifact, retaining draft |
| GET | `/api/websites/:id/export/static`, `/project` | Separate deployable/editable ZIP downloads |
| POST | `/api/import` | Multipart `file` editable package; creates a new owned site |
| GET/POST | `/api/assets` | List metadata / multipart image or PDF upload |
| GET/PATCH/DELETE | `/api/assets/:id/file`, `/api/assets/:id` | Private file; update `{name,alt}`; remove an unused library item |
| GET/POST | `/api/websites/:id/domains` | List instructions / add `{hostname}` and TXT challenge |
| POST/DELETE | `/api/websites/:id/domains/:domain/verify`, `/:domain` | Real DNS check / remove assignment |
| GET/DELETE | `/api/websites/:id/submissions`, `/:submission` | Private inbox / permanent message deletion |
| GET | `/api/websites/:id/analytics` | Measured request aggregates with provenance text |
| GET/PUT | `/api/preferences` | `{analytics:boolean}`, opt-in false by default |
| GET/PUT | `/api/ideas` | List / merge versioned Ideas package, preserve conflicts |
| PATCH/DELETE | `/api/ideas/:id` | PATCH `{idea,baseUpdatedAt}` with optimistic conflict detection / own removal |
| GET | `/api/updates` | Configured GitHub release metadata without client tokens |
| GET/DELETE | `/api/account/export`, `/api/account` | ZIP export / confirmed `{email,password}` account deletion |

Public listener: `POST /forms/:site` accepts name/email/message plus empty honeypot `website`; it requires an active published contact component and is rate-limited. `GET /_tls/allow?domain=...` answers 200/403 for Caddy. `GET /sites/:site/...` or verified domain root serves immutable static output only.

Examples:

```json
{"version":3,"document":{"schemaVersion":1,"name":"My portfolio","...":"See src/shared/schema.ts for the complete typed contract"}}
```

The abbreviated example is explanatory and is not a valid document payload. Use the actual exported document format or shared `SiteDocument` type. Contract tests live in `tests/api.test.ts`.
