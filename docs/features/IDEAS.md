# Developer Ideas

Open Settings and tap Persona's version three times. Developer Options and Ideas disappear after leaving the main Settings screen or 30 seconds without pointer/key activity; another triple tap is required. Ideas are separate from portfolio content collections.

Schema 1 contains project ID `openrecode-persona`, export timestamp and a list of ideas. Each idea has stable UUID, title, description/reproduction details, category, priority, status, creation/update timestamps and implementation references. Allowed statuses are Pending, Approved, Deferred, In Progress, Implemented and Rejected. Data remains editable/reopenable. Implemented must mean verified work, with commit/version/changelog references; recording or approving an idea never adds it to release highlights automatically.

The UI supports create, edit, duplicate, delete, search, filter, sort, multiple selection/status changes, JSON and Markdown exports and import review. JSON validation rejects unknown format/status values. Import previews new/existing IDs, adds unseen IDs and preserves existing records. Conflicting entries are not silently overwritten or deleted. The server independently enforces ownership and merge behavior.

Local Ideas persist in IndexedDB. Connected Ideas are also persisted locally before server synchronization. A per-user offline queue replays changes on reconnection; timestamp conflicts preserve the local copy instead of overwriting a newer remote idea. Status transitions append timestamped history (bounded to 500 entries). The Ideas screen retries on the browser online event. Native share sheets, screenshots and automatic repository synchronization are not implemented. Exporting JSON is the one-action agent handoff.

Agents read `docs/IDEAS.json` at session start. It initially contains zero pending, approved or deferred ideas. Do not invent on-device retrieval or automatically implement unrelated imported ideas. Deliberately merge an exported collection into the repository after review, preserving identifiers and deferred entries. Use structured release metadata only for completed, verified changes.
