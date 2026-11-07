# Architecture

## Modules

- `src/shared/schema.ts`: versioned Zod documents, style whitelist, URL policy, component registry, stable IDs and safe tree operations. Browser and server use the same contract.
- `src/shared/templates.ts`: six document factories. Each invocation creates independent IDs and content.
- `src/shared/history.ts`: bounded command snapshots, undo and redo.
- `src/shared/renderer.ts`: deterministic semantic HTML, validated style output, responsive overrides, preview bridges and static site files.
- `src/client/main.tsx`: dashboard, workspace selection, account entry, navigation and application update prompt.
- `src/client/storage.ts`: IndexedDB, authenticated API client, optimistic site saving, recovery and portable downloads.
- `src/client/media.ts`: local raster processing, media persistence and private asset resolution for opaque sandbox frames.
- `src/client/components/Editor.tsx`: editing orchestration, canvas messaging and save lifecycle. Layers, Inspector, Content, Assets and SiteTools own their respective UI.
- `src/server/db.ts`: relational schema, SQLite/PostgreSQL adapters and serialized transactions. Ownership, versions, revisions, jobs and domains are relational; document trees remain validated JSON.
- `src/server/auth.ts` and `auth-extras.ts`: password hashing, hashed opaque sessions, passkeys and single-use email/reset challenges.
- `src/server/app.ts`: authenticated API and a separately constructed public delivery application.
- `src/server/publisher.ts`: durable job claims, static generation, file packaging and snapshot activation.
- `src/server/domains.ts`: scheduled domain revalidation and retention cleanup while the configured worker runs.

## Runtime boundaries

The editor listens on 3100, public delivery on 3101. In production APP_ORIGIN and PUBLIC_ORIGIN must differ. Use genuinely separate hostnames, preferably separate registrable domains for stronger browser site isolation. Authentication cookies are host-only and HttpOnly. Public delivery never installs account middleware or serves the administrative bundle.

The editor canvas is `srcdoc` with `sandbox=allow-scripts`, without allow-same-origin. Only generated bridge code runs; imported documents contain no executable functions or arbitrary HTML. Messages are accepted only from the exact iframe window and a random per-editor channel. Preview frames use a separate checked source and the same schema renderer. Private image data is fetched by the authenticated parent and supplied as image data URLs, rather than broadening frame privileges.

## Persistence and operation flow

An edit creates a complete validated document snapshot and enters command history. IndexedDB stores a recovery copy before debounced saving. Remote updates compare the expected version and transactionally record the next revision. A conflict retains recovery and offers export or explicit server reload.

A publish request snapshots the saved document in a job. One worker claims queued jobs, validates asset ownership, builds into a temporary directory, then renames the finished directory. Only successful artifacts can become the active pointer. Public serving resolves a current publication through the database on every request; unpublishing or removing a domain takes effect immediately. Rollback changes the pointer and preserves the editable draft.

The implementation intentionally has no Redis, paid hosting integration, arbitrary plugin runtime or required AI provider. One worker per instance is the supported operating model. See ROADMAP.md for scaling and advanced authoring gaps.
