# UADS 36 integration and validation — 2026-11-07

## Scope and acceptance

Apply the newest section 36, including the subsequent root-landing amendment. Preserve the existing Expo application, studio behavior and data; use the user-selected `Xarber/Persona`; deliver remembered web entry, reversible landing navigation, readable design and purposeful motion; prepare X-Center without deploying.

Inspected: both repository histories, root Expo package/AGENTS/license/tree, studio architecture, workspace entry/editor/modal/settings, CSS, service worker/source packaging, Compose and validation workflows. This is not a full application or native audit. Ideas file read: 0 Pending, 0 Approved, 0 Deferred. No on-device collection was accessed.

## Repository decision

The user explicitly selected `Xarber/Persona`. Its existing public visibility, `master` at `4dd5fbe9521a131e10eff797e81b87c7c82996e9`, Expo source/config/lockfile and MIT notice remain intact. A non-squashed subtree merge imports the complete studio history under `studio/` on `testing`. Studio original code retains its full AGPL-3.0-only license. No unrelated history is rewritten or repository deleted. The earlier private `Xarber/persona-studio` and original local workspace remain preserved backups, not the canonical destination.

The authoritative checkout for this integration is `/Users/xarber/Productivity/apps/Persona-repository`, with commands run in its `studio/` directory. No temporary branches/worktrees require deletion. Root validation configuration scopes commands/cache/artifacts to the studio and does not trigger full builds on testing. No default-branch change, promotion or release publication is performed.

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

Implementation batch complete. Final check results, fixes, screenshots and pushed commit identifiers are recorded below after verification. No external production, Docker/PostgreSQL, physical-device or native validation is implied.

## Hosting and release limits

X-Center configuration/runbook is prepared only; no server or proxy has been changed. Docker is unavailable locally. Real DNS/TLS, backups/restoration, SMTP and physical PWA installation remain unverified. iOS IPA/Simulator and Android APK/AAB are not applicable to this web studio; the preserved Expo starter is not a verified native portfolio editor. No hosted deployment, public release channel or store submission is authorized or activated.

The configured hardware-backed signing device was unavailable in prior development. New development commits use a per-command unsigned override, preserving global configuration. No re-signing or force push occurs.
