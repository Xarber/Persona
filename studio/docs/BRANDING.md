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
