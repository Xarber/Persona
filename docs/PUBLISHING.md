# Publishing and independent exports

Publishing is an explicit authenticated action against the saved draft version. It creates an immutable deployment record containing site ID, document, version, timestamps, status and a non-sensitive log. Queued/building/ready/failed/cancelled states are visible. A durable SQL claim prevents two worker ticks from claiming the same job. Only one publishing worker process per instance is supported; crash recovery requeues interrupted jobs.

The worker validates the document and all internal asset ownership, generates every page and collection detail route, copies media, generates PWA icons and checksums, writes a temporary directory and renames it into an immutable deployment directory. The current site pointer changes only after successful preparation. A slow superseded publication cannot replace a newer published version. A failed job leaves the prior pointer and artifact available.

The public listener serves `/sites/SITE_ID/` and directory routes from the active artifact. A verified custom hostname resolves the same site at `/`. It does not load the editor bundle. Direct navigation and refresh use generated `index.html` directories. Draft revisions remain on the authenticated API. Unpublish clears the current pointer; rollback selects a prior ready artifact and preserves the current draft.

## Export formats

**Static ZIP**: HTML, inline CSS, minimal interaction JavaScript, relative media, icon files, Web App Manifest, service worker, robots, sitemap, README and server-generated SHA256SUMS. Basic rendering is independent of Persona. Serve the extracted directory through a static HTTP server that supports directory index files; opening file:// is not the PWA verification path. Contact forms become a configured email link or an explicit unconfigured notice. Analytics/inboxes do not silently depend on the old server.

**Editable ZIP**: `persona.json` with format `persona-project`, schemaVersion 1, a validated document and asset manifest; `assets/UUID` stores checksummed attached files. Imports validate limits, paths, schema, asset hashes and decoded raster types. Internal asset IDs are remapped to the importing owner; no imported executable code runs. Imports create a new site instead of replacing another site.

## Limitations

Assets are filesystem-backed, not S3. Publishing jobs run serially, not as a distributed multi-worker queue. Deleting a database record revokes serving immediately but does not physically garbage-collect old deployment files. Operators must review retention and run a backed-up cleanup procedure. There is no authorized external hosting deployment connector or public production deployment yet.
