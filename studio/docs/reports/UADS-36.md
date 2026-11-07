# UADS 36 integration and validation — 2026-11-07

## Scope and acceptance

Apply the newest section 36, including the subsequent root-landing amendment. Preserve the existing Expo application, studio behavior and data; use the user-selected `Xarber/Persona`; deliver remembered web entry, reversible landing navigation, readable design and purposeful motion; prepare X-Center without deploying.

Inspected: both repository histories, root Expo package/AGENTS/license/tree, studio architecture, workspace entry/editor/modal/settings, CSS, service worker/source packaging, Compose and validation workflows. This is not a full application or native audit. Ideas file read: 0 Pending, 0 Approved, 0 Deferred. No on-device collection was accessed.

## Repository decision

The user explicitly selected `Xarber/Persona`. Its existing public visibility, `master` at `4dd5fbe9521a131e10eff797e81b87c7c82996e9`, Expo source/config/lockfile and MIT notice remain intact. A non-squashed subtree merge imports the complete studio history under `studio/` on `testing`. Studio original code retains its full AGPL-3.0-only license. No unrelated history is rewritten or repository deleted. The earlier private `Xarber/persona-studio` and original local workspace remain preserved backups, not the canonical destination.

The authoritative checkout for this integration is `/Users/xarber/Productivity/apps/Persona`, with commands run in its `studio/` directory. The original private checkout and its ignored runtime data are preserved at `/Users/xarber/Productivity/apps/Persona-studio-backup`; the temporary integration clone now occupies the canonical workspace path. No temporary branches/worktrees require deletion. Root validation configuration scopes commands/cache/artifacts to the studio and does not trigger full builds on testing. No default-branch change, promotion or release publication is performed.

## UI review

| Before | After | Why |
| --- | --- | --- |
| Dashboard alone at root | Public landing on first visit; explicit Open App remembered | Apply newest root-route requirement without repeated promotion |
| Secondary About view | Root logo return, history-aware re-entry, mounted inert editor | Preserve active document and unsaved work |
| Unhandled browser preference failures | Shared exception-safe preference adapter with session fallback | Storage denial must not prevent application entry |
| Generic dialog association and removal | Explicit accessible heading, close/focus cleanup | Reliable screen-reader naming and keyboard return |
| Pale small secondary studio text | Stronger shared and hardcoded secondary text | Readable hierarchy in light/dark themes |
| Inconsistent timing | 140/200 ms tokens, entry opacity/6 px shift, reduced motion | Functional feedback without slowing editing |
| Generic standalone hosting instructions | X-Center loopback overlay and existing-proxy contract | Prepare a safe target without displacing infrastructure |

The landing uses original branding, meaningful Lucide icons, a real editor capture, implemented features, installation options, setup/privacy/license links and truthful native limitations. Public markup is prerendered into the production shell for indexing; no account data is rendered. Root remains the PWA start URL. `/about/` is a compatibility alias normalized to `/`, not the only landing location. App/hash auth links bypass the introduction. Root Expo code never imports the browser entry shell. Dialog dismissal, typing, undo/redo and keyboard commands remain immediate. No animation library or large SDK is added.

## Verification

Passed locally on Node 24/macOS with installed desktop Chrome:

- Clean dependency install; TypeScript check; 39 Vitest cases across document, API, update and development-security modules; formatting check; production build; production dependency audit (0 vulnerabilities).
- All **9 Playwright cases passed** in 22.3 seconds. New coverage: first-visit root, actual prerendered HTML, remembered entry/reload, logo/editor preservation including pending changes, history back/forward, deep-link reload, denied browser preferences, accessible dialog name/Escape/focus, representative computed landing contrast ≥4.5 in both themes, 390 px layout, reduced motion and offline screenshot delivery. Existing create/edit/export, connected publishing/media/forms, Ideas expiry, cold offline editing and virtual passkeys also pass.
- YAML parsed with Ruby/Psych for base/overlay Compose and active root workflow/Dependabot. This is syntax evidence, not Docker Compose or runner execution.
- Compared preserved root source/config/license against master: no differences. Verified both original Git tips are ancestors of testing, and remote master remains at its original SHA.
- Visually inspected [desktop light](landing-light.png), [desktop dark](landing-dark.png) and [mobile dark](landing-mobile.png) captures. These are real browser captures, not physical device evidence or a full accessibility audit.

During verification, native dialog removal did not restore its trigger focus; explicit close/connected-trigger cleanup corrected it. The new editor logo needed explicit dimensions after replacing a directly styled image with a button; fixed in `4f54909`. A test setup was initially applied inside opaque sandbox frames; it now writes the entry preference only in the top frame. The round-trip test preserves pending edits immediately and waits for normal autosave before its separate full reload assertion, avoiding automatic dismissal of the existing recovery confirmation.

Build output retains non-fatal dependency annotation/chunk warnings, experimental Node SQLite/WebCrypto notices, and an ancestor Expo tsconfig warning because root Expo dependencies are intentionally not installed for studio-only validation. TypeScript and the production build pass; root Expo is not validated by those results. Docker/PostgreSQL, external DNS/TLS, real authenticators/SMTP and physical PWA installation remain untested.

Integration commits: `18481f9` (both histories), `3b4473a` (root setup), `e1bd7ca` (landing/UI/configuration), `4f54909` (visible editor control), plus the final recorded-entry/verification commit visible in Git history. All completed changes are pushed to `Xarber/Persona:testing`, unsigned. No GitHub workflow was dispatched, no beta/main promotion was made and no application release was published. Native IPA/Simulator/APK/AAB builds are not applicable to this web module. See [remaining production work](../ROADMAP.md).

## Hosting and release limits

X-Center configuration/runbook is prepared only; no server or proxy has been changed. Docker is unavailable locally. Real DNS/TLS, backups/restoration, SMTP and physical PWA installation remain unverified. iOS IPA/Simulator and Android APK/AAB are not applicable to this web studio; the preserved Expo starter is not a verified native portfolio editor. No hosted deployment, public release channel or store submission is authorized or activated.

The configured hardware-backed signing device was unavailable in prior development. New development commits use a per-command unsigned override, preserving global configuration. No re-signing or force push occurs.
