# Visual editor

The studio separates Layers/Insert/Pages, a sandboxed HTML canvas and an inspector. Selection adds an outline through a message instead of changing document positions. Double-click editable canvas text; blur commits text to the corresponding property. Inspector changes produce validated document commands. Text is escaped during rendering and never interpreted as HTML.

Layer handles use dnd-kit 6.3.1 and sortable 10.0.0, with a seven-pixel pointer activation threshold and keyboard coordinates. Space starts keyboard dragging, arrows move, Space drops and Escape cancels. Up/down controls provide another arrangement path. Container moves reject descendants and leaf targets. Multiple layer selection supports modifier-click; copy/paste, duplicate and delete operate on selected snapshots. Context menus expose the same commands.

Cmd/Ctrl+Z undoes; Shift+Cmd/Ctrl+Z redoes; Cmd/Ctrl+C/V/D copies, pastes and duplicates; Cmd/Ctrl+S saves. Text fields keep their normal editing shortcuts. The command history retains 75 snapshots. Undoing then making a new edit discards the redo branch.

Desktop (1200px), tablet (820px) and mobile (390px) use real iframe viewport widths and separate style overrides. Overrides inherit desktop → tablet → mobile. Zoom scales the editor representation without changing the actual layout viewport. Generated CSS applies project column controls to its inner grid and hero typography controls to its heading. Theme tokens are global; per-node overrides persist.

Autosave waits 650ms after edits and first writes an IndexedDB recovery draft. Remote version conflicts never overwrite the newer server document. The editor shows retry/export/reload actions. Navigation attempts save; leaving after failure requires acknowledgement. The browser unload warning remains active for unsaved changes. Revisions can be restored as a new draft without modifying the public website.

Pages can be created, renamed, duplicated and deleted, assigned safe slugs, marked as homepage and included/excluded from navigation. Project collection detail pages are generated separately. Preview routing uses isolated messages rather than navigating into administrative routes. A separate-tab preview is a self-contained sandbox wrapper. Exports are real multi-page static directories.

Limitations: direct text editing is plain text, not a rich-text toolbar; layout drag operations occur in Layers rather than arbitrary freeform canvas coordinates; no alignment guides, arbitrary absolute positioning or custom breakpoint editor is implemented. The desktop inspector remains available by horizontal scrolling on narrow editing windows. See ROADMAP.md.
