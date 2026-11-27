# X-Center ID in Persona Studio

Local editing and downloads are available without an account. A Persona account
holds server-owned workspaces, drafts, assets, publishing history, and domains.
A user can link that account to X-Center ID from General Settings. Link before
using the X-Center ID sign-in option in a new browser. Persona resolves the same
existing account by the validated issuer and subject. The provider’s email and
display name cannot establish a mapping.

## Settings, portfolios and files

- **Settings sync** saves or restores appearance and automatic update checking.
  The user selects the direction and confirms replacement of an existing copy.
- **Portfolio copies** store private portfolio documents. The provider checks the
  expected revision on writes. Users can browse saved copies and restore a
  separate draft with the normal account-owned asset validation. Referenced
  media remains in the original Studio workspace. For a portable copy with
  media, save the editable project ZIP.
- **Save to Files** writes the static or editable ZIP to the root of the user’s
  X-Center ID Files on explicit request. Existing exports remain available.
  The SDK uses chunked transfer for ZIPs above 2 MiB. Retrying from the UI starts
  a new upload. Interrupted-transfer recovery and cross-instance media restore
  are open work.
- **Service records** use the verified-app SDK and a separate database key.
  After verifying a hosted deployment, run
  `npx tsx src/server/xcenter-service.ts` with the exact `BUILD_COMMIT`,
  `PERSONA_DEPLOYMENT_ENV`, `XCENTER_CLIENT_ID`, and protected
  `XCENTER_DATABASE_KEY` configured. It writes a private deployment record
  keyed by environment and commit and verifies an existing matching record on
  retries. Portfolio data, submissions and credentials stay out of service records.

## Configuration and validation

Use the active confidential Website backend registration and exact return URL
`https://persona.xcenter.it/api/account/callback`. Configure `XCENTER_CLIENT_ID`,
`XCENTER_CLIENT_SECRET`, `XCENTER_REDIRECT_URI` and a stable, independently
generated 32-byte base64 `PERSONA_XCENTER_STORAGE_KEY` on the backend. Keep values
in protected deployment configuration. Preserve the storage key with encrypted
backups and restrict access to it independently of the Studio database. The
callback must be served over HTTPS by Persona and its query must be omitted
from proxy logs. The X-Center Nginx example includes that rule.

The backend SDK handles authorization code exchange with PKCE and validates
the identity. Persona stores a short-lived transaction and consumes it once.
A protected callback cookie binds the flow to the initiating browser. A link also
requires a Persona sign-in within the preceding 15 minutes and the original session to remain valid. The provider tokens never
reach browser JavaScript. Access tokens are encrypted at rest and only used for the
account and scope that granted them. This first integration requests a short
session. Reconnect to renew access. **Disconnect** removes Persona’s saved
grant and association. To revoke the provider grant, unlink Persona in the user's
X-Center ID dashboard. Existing Persona sign-in and recovery routes remain
available while a safe passwordless migration is pending.

See [the managed SDK data guide](https://github.com/Xarber/xcenter-id-sdk/blob/57c4930abe34003dfb74923ec823ef6245a985ce/docs/DATA_CLIENTS.md)
and [hosted developer documentation](https://id.xcenter.it/docs).
