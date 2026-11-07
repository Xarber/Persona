# Third-party notices and compatibility

Original Persona code/branding is AGPL-3.0-only. Dependencies and third-party assets retain their respective licenses. Installed package metadata is inventoried in `dependency-licenses.json`; this inventory covers the local installation, not every optional binary for every operating system.

Principal dependencies: React, Vite, Express, dnd-kit, Zod, pg, SimpleWebAuthn and most utilities use MIT; TypeScript, Playwright and sharp use Apache-2.0; Lucide uses ISC; Nodemailer uses MIT-0; JSZip offers MIT OR GPL-3.0-or-later (use the MIT option); pako includes MIT and Zlib; additional utilities use BSD-3-Clause, ISC or 0BSD. caniuse-lite data uses CC-BY-4.0. Package metadata omits busboy/streamsearch licensing, but their installed LICENSE files contain the MIT permission text and Brian White notice.

sharp's libvips binary is LGPL-3.0-or-later and uses shared native libraries. Keep its license/notices and corresponding library source information when distributing binaries or containers. Review the exact bundled library versions and upstream sharp/libvips build source for every distribution target; do not claim Persona's license relicenses these libraries. AGPLv3 original code can coexist with these compatible permissive/LGPL dependencies subject to their respective notice/source obligations.

Sources: [React license](https://github.com/facebook/react/blob/main/LICENSE), [Lucide license](https://lucide.dev/license), [sharp licensing](https://sharp.pixelplumbing.com/install/#licensing), [sharp-libvips source](https://github.com/lovell/sharp-libvips), [JSZip license](https://github.com/Stuk/jszip/blob/main/LICENSE.markdown). Keep installed dependency notices in redistributed node_modules and generated attribution output.

No external portfolio photographs, restricted fonts or trademark artwork were bundled. Templates use fictional demonstration text, original CSS shapes and system-font references. Screenshots are actual rendered application/export captures, not claims of implemented external services.

Builds include `source.zip`, generated from an explicit source/configuration allowlist. It excludes runtime data, credentials, .env, Git metadata and dependencies. The studio links this archive as Corresponding Source. Operators distributing modified versions must regenerate and retain the exact matching source; private GitHub visibility does not remove this requirement.
