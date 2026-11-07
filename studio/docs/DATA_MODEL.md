# Data model and migrations

## Site document, schema 1

A document contains name, description, originating template, theme tokens, pages, structured collections and SEO metadata. Each page has a stable UUID, unique safe slug, name, description, navigation visibility and an ordered node tree. The empty slug denotes the homepage and must exist.

Nodes have UUID, registered type, whitelisted properties, base style, tablet/mobile overrides and children. Parent relationships are derived from tree position; duplicate IDs, cycles introduced by move operations, invalid nesting, duplicate slugs and incompatible schemas are rejected. Depth is limited to 12 and total document nodes to 1500. Maximum pages: 30. Collection item slugs are unique across the whole document because generated detail routes share the projects path. Collections use a reusable entry schema with title, slug, summary, body, image, URL, tags and featured flag. The schema is not arbitrary HTML.

Style controls use bounded numbers, enums, booleans and hex colors. Links allow http(s), mailto, tel, anchors and relative paths; JavaScript URLs and control characters are rejected. Unknown keys and unknown component types fail validation with a visible error. Schema 1 is the first format: no older production schema is invented. Future versions must introduce an explicit migration dispatch before accepting previous formats.

## Relational storage

`users` owns `sessions`, `websites`, `assets`, `ideas`, `preferences`, `email_status` and `passkeys`. A website owns `revisions`, `deployments`, `domains`, `submissions` and `analytics`. Foreign keys cascade account/site removal. `auth_tokens` contains hashed single-use verification, reset and WebAuthn challenge handles; account removal explicitly clears associated entries. `audit` records sensitive operations without session tokens or document contents.

`websites.version` is the draft version. `published_version` and `deployment_id` identify the live snapshot; they can lag behind the draft or point to an earlier successful version after rollback. Revisions are unique by site/version. Domains are globally unique by hostname. Analytics are unique by site/day/path. SQL placeholders are parameterized in both database adapters.

`npm run migrate` idempotently creates the initial schema and records migration version 1. There are no destructive migrations. For future schema changes, add ordered migrations and restoration instructions; never silently mutate user documents.

## Browser storage

IndexedDB database `persona-workspace`, object store `kv`, holds `local-sites`, local revisions, `local-assets`, local ideas, per-user cached sites and per-user/site recovery drafts. Browser preferences and the last displayed application version use localStorage. No authentication token is stored in either system.

An offline connected workspace can reopen previously cached documents on its already-used device. Recovery edits are replayed when online, subject to version checks. Local projects and attached media are independently exportable. Clearing browser storage deletes local-only work; portable backups are important. The service worker caches application code, not API responses.
