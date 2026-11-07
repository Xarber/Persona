# Offline work and transfer

Local documents, assets and Ideas use IndexedDB and do not require registration. The production service worker precaches the application shell and hashed code chunks, excludes all API responses, and supports reopening the local workspace offline. New worker activation is user-controlled; it does not automatically reload unsaved work.

A connected workspace caches previously fetched site documents in its own IndexedDB namespace. When offline, a previously used account identity can reopen those cached sites on the same device without storing authentication tokens. Edits write recovery snapshots. Reconnection attempts saving against the last server version: a conflict preserves recovery and requires explicit resolution. Uncached server sites and private remote assets are not promised to be available on a cold offline device. Local attached media are stored as blobs and remain available offline.

Editable project ZIPs are the supported cross-installation migration path. Assets have digests and are remapped to the receiving owner; imports create new sites. This preserves editable ownership without mandatory central infrastructure. Export a local project and import it after signing in to transfer into a connected workspace. Registration does not silently upload existing local projects.

No continuous peer-to-peer synchronization, background device discovery or collaboration protocol is implemented. A versioned portable package is intentionally the boundary for future authenticated peer transfer. Do not claim an agent can read private browser/device storage automatically. Repository Ideas are merged from a deliberately exported interchange file.
