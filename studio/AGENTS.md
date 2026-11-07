# Persona agent entry point

Persona is an independent AGPL-3.0-only portfolio studio, part of OpenRecode. Read `docs/INDEX.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, the relevant feature docs, and `docs/IDEAS.json` before substantial modifications. The original request is in `docs/SPECIFICATION.md`.

## Ideas review

At session start, read the actual project ideas file. Count pending, approved and deferred entries, compare related ideas with existing behavior, and summarize actionable ideas. Ask whether relevant optional ideas should be implemented now or another time; continue the current authorized work. Preserve deferred and unselected ideas. Never infer access to on-device Ideas. The UI exports versioned JSON for review; merge it deliberately into `docs/IDEAS.json`. Mark Implemented only after appropriate verification, with commit/version references and structured release notes.

## Engineering

- Preserve existing functionality and user data. Inspect before editing; make a concise plan with acceptance criteria.
- Keep `src/shared` browser-compatible; this is the authoritative schema, registry and rendering engine. Never execute imported code.
- `src/server` enforces ownership and origin checks. Published artifacts are served by a separate listener/origin without account cookies.
- Document meaningful changes under `/docs`. Do not describe roadmap items as implemented.
- Use Node 24+, exact dependency lockfile and version-matched official docs. `npm ci`, `npm run check`, `npm test`, `npm run build`, `npm run test:e2e`.
- Create a report for implementation batches. Distinguish Chromium simulation from physical-device, Docker, PostgreSQL and external DNS/TLS evidence.
- Work on testing or isolated temporary branches; Conventional Commits; integrate completed changes into testing. Promote testing → beta → main only with suitable validation. Clean task-created temporary branches/worktrees after safe integration.
- testing has no automatic full builds/releases. configured beta/main workflows prepare validation artifacts; the repository retains its existing public visibility; public release/deployment channels are not authorized. Do not deploy, buy domains, expose secrets, change visibility or incur paid charges.
- Never install large toolchains, delete user data or disrupt unrelated infrastructure without authorization.
- Native mobile artifacts do not apply: this is a web/PWA project. Do not create placeholder IPA/APK jobs.

## Security boundaries

Do not cache API responses in the service worker. Session tokens stay in HttpOnly cookies; no tokens in diagnostics. Import ZIPs are bounded and data-only. SVG/custom JavaScript uploads are rejected. Private assets must pass ownership checks before publication/export. Store original uploads separately; user-controlled HTML is never served on the editor origin. Custom-domain ownership and routing must be verified; stale assignments fail closed.

## Recovery

Draft saves use optimistic concurrency and transactional revisions. Keep device recovery drafts when saving fails or conflicts. Publishing builds immutable artifacts and activates only a successful deployment; failed publications preserve the previous version. Use `docs/DEPLOYMENT.md` for backups and rollback.

## Repository and UADS 36 context

The canonical repository is now `Xarber/Persona`, explicitly selected by the user. This module is nested in `studio/`; commands below run here. The original Expo starter at the repository root and its MIT notice are preserved. Studio originals remain AGPL-3.0-only. Do not rewrite or pretend to have validated the Expo application. Read `docs/reports/UADS-36.md` for integration scope and `docs/XCENTER.md` before any hosting work.

The public landing is the first-visit view at `/`; explicit Open App persists `persona-app-opened` and subsequent root visits open the studio. Logo navigation returns to the root landing without unmounting the editor. `/about/` is a compatibility entry normalized to `/`. UI changes use shared motion tokens, meaningful Lucide icons, accessible headings and reduced motion. Keep editing, undo/redo and keyboard actions immediate. Review light/dark contrast. X-Center is the default hosting target, but no deployment is authorized. The root `.github` configuration is active; nested `.github` files are source only. Never rewrite existing commits merely to add signatures.
