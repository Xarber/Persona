# Testing methodology

```sh
npm run check
npm test
npm run build
npm run test:e2e
npm audit --omit=dev --audit-level=high
```

Vitest executes shared-schema/renderer/history tests and Supertest integration tests. Integration tests isolate storage in an OS temporary directory, use disposable `.test` accounts and exercise real database/API behavior. DNS responses are explicitly mocked: tests cover TXT proof, routing, authorization and expiry without claiming real provider propagation or certificates. Email isn't sent during these tests.

Playwright runs the production build against a separate SQLite/storage namespace (`.data/e2e`) on ports 3200/3201. It edits actual sandboxed canvas text, changes responsive controls, exercises undo/redo, saves/reloads, exports ZIPs and serves an extracted static export on an independent temporary server. Other cases cover account creation, media upload, keyboard arrangement, publication, public contact submission, Developer Ideas and production offline shell behavior. Screenshots/traces are retained for failures. The test runner uses installed Chrome locally; CI installs Chromium explicitly in the runner.

The test suite must inspect real resulting behavior: a successful bundle is not proof that a publication, image, form, import, rollback or browser update worked. Report actual executed environments and remaining limitations in `reports/VALIDATION.md`. PostgreSQL, container/proxy behavior, real email delivery, real DNS/ACME, passkey hardware and physical iOS/Android installation each need their own evidence.

For manual QA, test keyboard-only dialogs/navigation, pointer drag activation/cancellation, responsive layouts, dark/light modes, reduced motion, focus visibility, save failure/retry, conflict recovery and published routing. Do not call an automated scan alone full accessibility certification or a targeted security suite a complete audit.
