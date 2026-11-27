# Visual editor

The studio separates Layers/Insert/Pages, a sandboxed HTML canvas and an inspector. Selection adds an outline through a message instead of changing document positions. Double-click editable canvas text; blur commits text to the corresponding property. Inspector changes produce validated document commands. Text is escaped during rendering and never interpreted as HTML.

Layer handles use dnd-kit 6.3.1 and sortable 10.0.0, with a seven-pixel pointer activation threshold and keyboard coordinates. Space starts keyboard dragging, arrows move, Space drops and Escape cancels. Up/down controls provide another arrangement path. Container moves reject descendants and leaf targets. Multiple layer selection supports modifier-click; copy/paste, duplicate and delete operate on selected snapshots. Context menus expose the same commands.

Cmd/Ctrl+Z undoes; Shift+Cmd/Ctrl+Z redoes; Cmd/Ctrl+C/V/D copies, pastes and duplicates; Cmd/Ctrl+S saves. Text fields keep their normal editing shortcuts. The command history retains 75 snapshots. Undoing then making a new edit discards the redo branch.

Desktop (1200px), tablet (820px) and mobile (390px) use real iframe viewport widths and separate style overrides. Overrides inherit desktop → tablet → mobile. Zoom scales the editor representation without changing the actual layout viewport. Generated CSS applies project column controls to its inner grid and hero typography controls to its heading. Theme tokens are global; per-node overrides persist.

Autosave waits 650ms after edits and first writes an IndexedDB recovery draft. Remote version conflicts never overwrite the newer server document. The editor shows retry/export/reload actions. Navigation attempts save; leaving after failure requires acknowledgement. The browser unload warning remains active for unsaved changes. Revisions can be restored as a new draft without modifying the public website.

Pages can be created, renamed, duplicated and deleted, assigned safe slugs, marked as homepage and included/excluded from navigation. Project collection detail pages are generated separately. Preview routing uses isolated messages rather than navigating into administrative routes. A separate-tab preview is a self-contained sandbox wrapper. Exports are real multi-page static directories.

Limitations: direct text editing is plain text, not a rich-text toolbar; layout drag operations occur in Layers rather than arbitrary freeform canvas coordinates; no alignment guides, arbitrary absolute positioning or custom breakpoint editor is implemented. The desktop inspector remains available by horizontal scrolling on narrow editing windows. See ROADMAP.md.

## Compact browser layout

At viewport widths up to 650 px, the editor shows one of Canvas, Structure or Style at a time. Panel switching keeps the same document, selection and undo history. Fit chooses a zoom preset based on the canvas's available width. The phone layout uses the same renderer and persistence as desktop.

## Page order

In **Pages**, select a page and use the up or down arrow to change its position.
The position is announced as the page moves. Navigation in the canvas, published
sites and exports follows the order of visible pages. Reordering uses the normal
undo, redo and autosave path. The page marked Home retains its root URL and opens
first when reopening the editor, regardless of its position in the menu.

In **Page settings**, use **Navigation label** to shorten or rename the link in
the portfolio's desktop and mobile menus. An empty label uses the page name.
The page title and route keep their existing values.

A saved custom label adds an optional field to the document. An older release
with a strict schema will reject that field. Include this in the rollout review
and retain the pre-upgrade snapshot. If rollback is required after users have
saved labels, preserve the newer drafts before converting copies for use by
the older release.
