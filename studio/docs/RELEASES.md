# Branches, builds and publication

This new web implementation uses testing → beta → main. Work is integrated on testing. beta/main must not imply stability merely because a branch exists; only promote suitably validated work. Conventional Commits are required. Existing `Xarber/Persona` is a separate public Expo starter on master and is not rewritten or migrated.

`validate.yml` prepares independent core, browser and PostgreSQL jobs on beta/main, pull requests targeting those channels, or workflow_dispatch. testing does not automatically run full builds/releases. Artifacts include channel and exact source SHA. Workflow permissions are read-only and no publishing credentials are embedded. No public deployment, repository visibility change, external app store or public release channel has been authorized.

Node web/PWA is the supported artifact. Native iOS unsigned IPA, Simulator app, Android APK and AAB jobs are not applicable and are not fabricated. Docker Compose is a self-hosting configuration, not evidence of production deployment.

Set BUILD_COMMIT to the exact source SHA during `npm run build` and container build. Increment actual application version/build metadata for a real release; never use a fixed metadata tag as the application version. User-facing release metadata lives in `src/shared/schema.ts` and CHANGELOG.md; it must describe only implemented behavior. Developer diagnostics expose the exact build marker; complete Git history stays in the repository.

GitHub release discovery is configured through server-only UPDATE_REPOSITORY, RELEASE_CHANNEL=stable|beta and optional UPDATE_GITHUB_TOKEN for private metadata. No token is placed in the client. The server caches checks for ten minutes, filters drafts/metadata releases, compares semantic versions and labels stale fallback results. The client checks at startup and foreground with six-hour throttling; Settings offers manual checks. The current web application notifies about waiting service workers and offers a manual reload after saving. It does not remotely replace self-hosted server binaries. Artifact-level release-manifest validation and full developer commit metadata remain on the roadmap.

Before a published release: run checks, collect artifacts, verify commit/version, inspect checksums and downloads, stage and verify the actual service, preserve rollback artifacts, then publish only through specifically authorized channels. See DEPLOYMENT.md.

Development commits in this initial session are unsigned: the configured hardware-backed SSH signing key could not sign because its device was unavailable. The per-command signing override did not change the user's global signing configuration. Sign or attest a reviewed release with the intended identity before using signed-release policy as a validation claim.
