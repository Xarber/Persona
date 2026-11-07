# Remaining work and limitations

The core vertical workflow is implemented; the complete original specification is broader than this 0.1 implementation. Do not label all phases production-complete.

## Before production exposure

- Execute PostgreSQL and Docker/Caddy validation; test backups/restoration and the exact deployed commit.
- Verify real DNS ownership changes, routing, ACME issuance/renewal and removal on a controlled external hostname. Extend apex-domain routing before offering a fully automatic apex workflow.
- Exercise passkeys with supported real authenticators and configured SMTP verification/password recovery. Protect or close registration as appropriate.
- Complete accessibility, large-document, long-session and multi-browser review; test physical PWA installation/update on iOS, Android and desktop.
- Add physical orphan-file cleanup with revision/deployment reference checks and a safe retention plan.

## Requested authoring and developer features still incomplete

- Rich text, direct canvas insertion/reparenting feedback, more advanced components and interactions, richer custom responsive rules and safe scoped CSS.
- Complete page ordering/navigation placement, dedicated content schemas, template package catalog and template previews beyond creation thumbnails.
- Asset folders/replacement/cropping, responsive source sets, custom-font validation and optional S3 storage adapter.
- Primary-domain selection/redirects, richer SEO structured data, analytics UI and optional SMTP contact delivery.
- Stronger offline connected-workspace media caching and explicit conflict-resolution UI; local Ideas capture and queued connected sync are implemented.
- Ideas screenshot attachment, controlled repository sync and a full structured developer changelog with complete commit messages. Status history is implemented with a 500-entry bound.
- Artifact-level stable/beta release manifests, complete release-history summaries and more comprehensive service-worker upgrade tests. Authenticated private GitHub metadata is supported through a server-only environment token.

## Optional later extensions

AI providers with explicit content consent, authenticated collaboration, peer-to-peer transfer, public community templates, sandboxed executable extensions and external-host deployment adapters. None is silently introduced or required to build/publish/export a portfolio.
