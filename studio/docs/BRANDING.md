# Persona identity

The user supplied the name Persona and the line “Your work. Your identity. Your web.” The name is preserved; no claim of global naming/trademark clearance is made. The independent OpenRecode portfolio studio identity combines a compact P monogram, a small punctuation dot and a warm botanical palette.

| Token | Value |
| --- | --- |
| Forest primary | `#1d4b3e` |
| Light symbol | `#e8efd7` |
| Studio background | `#f8f9f5` |
| Soft panel | `#f2f4ed` |
| Ink | `#29342f` |
| Accent | `#c9d8b6` |

Typography uses system sans for the studio, with system serif and mono choices in portfolios. No proprietary font is redistributed. Lucide icons use their ISC license; original geometric portfolio illustrations are generated with CSS rather than downloaded copyrighted imagery.

`public/branding/icon.svg` is the editable master. It contains stable `background`, `symbol` and `highlight` groups plus a reusable gradient definition. Background and foreground can be recolored independently for dark, monochrome or tinted treatment. `banner.svg` has editable background, symbol and wordmark layers. Keep these originals rather than editing only flattened exports.

Run `npx tsx scripts/branding.ts` for 192/512 PNG icons, a padded 512 maskable icon and a 180 Apple Touch Icon. The maskable export adds safe background padding. These assets apply to the web/PWA only; no fake native icon catalog or IPA/APK is produced. Production screenshots under docs/reports are captures of actual rendered interfaces; do not relabel them as physical-device evidence.

Keep small-size recognition and contrast when changing the master. Do not bake platform branding into a user's portfolio content. Website icon generation should use the site's own identity rather than the studio's application icon.

## Landing and motion

The integrated root landing uses warm `#f5f4eb`, ink `#203e32` and readable secondary `#526451`; dark equivalents are `#19271f`, `#e2e9d8`, `#b6c3ad`. `public/branding/studio-preview.png` is copied from the actual editor capture in `docs/reports`, not a product mockup. Lucide feature icons accompany visible text. The landing retains the app’s chosen appearance; no external font, analytics or image service is requested.

Studio shared motion tokens: fast 140 ms, panel 200 ms, ease-out `cubic-bezier(0.23,1,0.32,1)`. Dialog, toast and menu insertion use a 6 px entry shift and opacity, with instant keyboard dismissal and no delayed unmount. Landing hover shifts apply only to fine hover pointers. There is no animation of canvas document edits, undo/redo, or typing. Reduced motion removes transitions and animations; unsupported CSS entry motion falls back to immediate display. Existing native dialog focus management remains in use, with explicit accessible heading association.
