# Feature status, 0.1

“Implemented” refers to code, not unexecuted external validation. See reports/VALIDATION.md for executed evidence.

| Area | Implemented behavior | Material remaining scope |
| --- | --- | --- |
| Dashboard | Multiple sites, real thumbnails, search/sort/status filters, grid/list, create/rename/duplicate/archive/restore/delete/import/export | Dedicated recent-activity feed |
| Creation | Six templates, blank canvas, optional guided name setup | Rich guided profile questionnaire is intentionally not required |
| Editor | Opaque canvas, selection, direct plain-text editing, nested trees, layers, keyboard/pointer reorder, copy/paste/duplicate/delete, undo/redo, context actions | Rich text, direct canvas placement guides, arbitrary positioning |
| Persistence | IndexedDB, debounced drafts, recovery, optimistic remote saves, transactional revisions, revision restore | More extensive cross-tab and offline merge UX |
| Design | Global color/font/radius/spacing/width tokens and per-node base/tablet/mobile styles | Custom breakpoints, arbitrary CSS, full interaction graph |
| Components | 21 registered basic/layout/portfolio/media/accordion components | Several advanced types in the original spec remain absent |
| Content | Reusable structured collections, shared bindings, generated project detail pages | Dedicated schemas/UI for each profile/award/certification type |
| Pages | Create/rename/duplicate/delete/home/slug/navigation/SEO | Page ordering and navigation-placement designer |
| Media | Local/server raster/PDF uploads, previews, metadata, upload progress, alt text, WebP processing, original retention | Folders, replace, interactive crop UI, custom fonts, S3 |
| Preview | Isolated responsive preview and separate-tab package, internal navigation | Broader interaction/browser coverage |
| Publishing | Queue, immutable artifacts, logs, version pointer, rollback, unpublish and failed-build preservation | Distributed worker leases, physical orphan cleanup |
| Export | Editable checksummed packages and independent static ZIPs with media/routes/PWA | Streaming huge exports and full older-format migrations |
| Domains | TXT challenge, CNAME verification, unique ownership, freshness, public routing and Caddy ask architecture | Apex verification, primary domain/redirect UI, real external DNS/TLS evidence |
| SEO | Site/page descriptions, canonical base, Open Graph, indexability, robots, sitemap | Social-preview image cropping and more structured-data controls |
| Contact | Validated rate-limited self-hosted form, private inbox, explicit static-export fallback | SMTP visitor-message delivery/custom fields |
| Analytics | Opt-in measured page-request aggregates, no raw IP/cookies | A complete analytics dashboard and richer privacy-safe metrics |
| Auth | Email/password, sessions/revocation, optional SMTP verification/reset, passkey server/browser flows | Physical authenticator and actual mail-server validation |
| Privacy | Account/project export, confirmed account/site deletion, unpublish, domain removal | Physical artifact garbage collection and automated backup policy |
| Developer | Triple-tap expiring options, redacted diagnostics, Ideas import/export, status history, offline queue and conflict-preserving sync, changelog | Automatic repository sync, screenshot attachments, complete developer commit view |
| PWA | Manifest/icons, production shell precache, offline local editing, waiting-worker update prompt | Actual mobile/desktop installation and full update-transition validation |
| Delivery | Docker/Compose/Caddy, SQLite/PostgreSQL adapter, CI job definitions | Actual container/PostgreSQL/proxy execution and authorized production hosting |

AI assistance, cross-app private-data imports, executable plugins, collaboration and automated external hosting are not required for core functionality and are not implemented. No mock control is claimed as a completed integration.
