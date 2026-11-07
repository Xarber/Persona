# Persona 0.1 validation report

Date: **2026-11-07**, Europe/Rome. Scope: the new web/PWA implementation in this workspace. This is evidence for the scenarios listed below, not a claim that every item in the original specification or every possible application flow has been completed or audited.

## Implemented scope

A functioning dashboard, visual editor, shared validated renderer, six independent templates, responsive controls, nested document operations, plain-text canvas editing, undo/redo, local storage/recovery, authenticated workspaces, revisions, media, structured content, pages, publishing/export, deployment rollback, DNS architecture, SEO, contact inbox, privacy, developer Ideas and PWA setup. See [feature matrix](../FEATURES.md) for partial/unimplemented areas.

## Executed checks

| Check | Result | Evidence and boundaries |
| --- | --- | --- |
| `npm run check` | Passed | Strict TypeScript across application, server, scripts and tests |
| `npm run format:check` | Passed | Prettier checks for source, scripts, tests and TypeScript config |
| `npm test` | **38 passed**, 3 files | 22 authenticated API/integration cases, 14 document/history/renderer cases, 2 release-selection cases |
| `npm run build` | Passed | Vite production output, scoped worker generation and explicit-allowlist Corresponding Source ZIP |
| `npm run test:e2e` | **5 passed** | Production-mode application and separate public listener; installed headless Chrome on macOS |
| `npm audit --omit=dev --audit-level=high` | Passed, no known reported vulnerabilities | Local dependency snapshot only; not a permanent guarantee |
| `git diff --check` | Passed | No whitespace-error findings in tracked diffs |

### Unit and API integration coverage

- Six template round-trips, schema/URL/style rejection, duplicate IDs/routes, valid nesting, cycle prevention, sibling movement in both directions, collision-safe collection routes, undo/redo and responsive inheritance.
- Safe escaping, semantic static pages, collection detail routes, scoped offline output, semantic version comparison, stable/beta separation and metadata/downgrade rejection.
- Registration, sessions, unauthorized access/origin rejection, optimistic concurrent saves and transactional revision rollback.
- Actual raster decoding/processing and private asset access; SVG/malformed-image rejection and cross-owner reference rejection.
- Queued publication, static asset delivery, unpublished-draft isolation, failed-build preservation, republishing, API-level rollback and unpublish.
- Independently packaged static export, editable ZIP round-trip, malformed package rejection, account export/originals and confirmed account deletion.
- DNS TXT/routing authorization, stale-proof rejection and revoked host routing using explicitly mocked DNS responses.
- Published public form validation and private inbox ownership; opt-in request counters.
- Ideas merge/deduplication, optimistic update rejection, status-history preservation and cross-owner rejection.

### Browser coverage

1. Create a local website, choose a template, double-click/edit actual canvas text, add a heading, undo/redo, apply a mobile override, reload and verify persistence; preview; export editable/static ZIPs; extract the static ZIP and render it on a separate HTTP server with collection navigation and a 390px viewport.
2. Register an isolated test account, reorder layers using the keyboard, verify the actual resulting order, upload/select a real test image, verify decoded canvas dimensions, publish, open the public website, submit a contact message and see it in the private inbox.
3. Unlock Developer Options, create/reopen a persistent idea, leave Settings and verify access disappears, then advance the test clock beyond 30 seconds and verify inactivity expiry.
4. Register the production service worker, reload offline, reopen the responsive shell and create a local draft while offline.
5. Register and authenticate a passkey using Chrome's **virtual authenticator**. This validates the WebAuthn server/browser exchange, not physical biometric/hardware behavior.

Tests use disposable `.test` identities and generated media. Server E2E storage is `.data/e2e`; API tests use a separate temporary directory. No test emails were delivered to external recipients, no private diary/import sources were accessed, and no real domain was modified.

## Findings corrected

- Mixed automatic light/dark surfaces were made consistent.
- sharp was upgraded from a vulnerable installed baseline to 0.35.5; the resulting audit returned no reported vulnerabilities.
- Sandboxed preview access to serviceWorker was guarded; previews remain opaque-origin frames.
- Generated files beneath the private `.data` directory were explicitly served from trusted generated paths; Express's dotfile default had otherwise rejected them.
- Editor images load eagerly and are resolved in the authenticated parent, retaining sandbox isolation.
- Empty media-resolution work no longer replaces the iframe while direct text editing starts.
- The private inbox refreshes when opened after a visitor submits a message.
- Sibling movement accounts for downward insertion; keyboard handles have explicit activator refs and tests wait for the library's accessible drag state/announcements.
- Fit-to-canvas chooses a supported zoom value so its displayed percentage matches the actual scale.
- Asset deletion preserves media referenced by recoverable revisions/deployments; independent export includes internal download links as well as image references.
- Collection route uniqueness prevents one collection's generated detail page from overwriting another.

## Screenshots

These are actual browser renderings, not mockups or physical-device screenshots:

- [Desktop visual editor](editor-desktop.png)
- [Responsive dashboard at 390px](dashboard-mobile.png)
- [Independent exported website at 390px](export-mobile.png)

The editor capture includes the deliberate layer-reordering scenario, so navigation appears after the hero in that edited test document.

## Remaining validation and limitations

- Docker and PostgreSQL command-line/runtime tools were unavailable locally; they were not installed. Compose/Caddy/PostgreSQL are prepared and have a CI job definition, but their actual runtime is not verified here.
- GitHub Actions jobs were **not dispatched**. Billing/quota inspection required an unavailable additional account scope, so no paid runner usage was assumed. No remote workflow success is claimed.
- No external DNS/ACME certificate issuance, renewal, apex routing or production deployment was executed.
- SMTP verification/password-reset delivery is implemented but lacks real mail-server evidence. Passkeys lack physical authenticator evidence.
- PWA manifests, registration, offline shell and responsive web behavior were tested. Actual iOS/Android/Desktop installation and a complete browser upgrade lifecycle remain unverified.
- Offline connected Ideas queue/conflict behavior and connected draft caches are implemented; broader multi-device/network-failure coverage remains necessary.
- Accessibility review was targeted to semantic output, labels, keyboard authoring, dialog behavior and responsive checks. No full WCAG certification or comprehensive assistive-technology audit is claimed.
- No Core Web Vitals, battery/memory or long-document benchmark is invented. The measured production main chunk was approximately 518 KB minified / 159 KB gzip and CSS 45 KB / 9.5 KB gzip. Vite reports a chunk-size warning; further route-level splitting is recommended.
- The interactive in-app browser was disabled in Work settings during the final manual pass. Automated Chrome verification and captured artifacts remained available.
- Rich text, some advanced components/interaction tools, page-ordering UI, media organization/cropping, primary-domain redirects, full developer commit views and other gaps remain in [ROADMAP.md](../ROADMAP.md). This is a tested 0.1 vertical implementation, not the complete final specification.

## Git, builds and deployment state

Repository: private [Xarber/persona-studio](https://github.com/Xarber/persona-studio). Existing public `Xarber/Persona` remains untouched. Implementation commits use Conventional Commits on `testing`; `beta` and `main` retain the bootstrap baseline and have not been promoted as feature-complete/stable releases. No temporary worktrees or task branches were created, so none require destructive cleanup.

Development commits are unsigned because the configured hardware signing device was unavailable. Only per-command signing was disabled; global signing settings were preserved. No release, prerelease, production service, public distribution endpoint or native mobile artifact was published. iOS IPA, Simulator app, Android APK and AAB are not applicable to this web/PWA project.

The final local build embeds its exact Git SHA through BUILD_COMMIT and includes matching source in `dist/source.zip`. Local preview/testing is not a production deployment and does not establish any external publishing authorization.
