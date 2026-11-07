# Implementation scope and acceptance criteria

The initial workspace was empty and had no Git history, implementation, package configuration or ideas collection. The requested platform is web/PWA with desktop/tablet authoring and mobile portfolio viewing. The name Persona was supplied by the user.

The core architecture uses a browser-compatible, validated document model and one deterministic renderer. A React application owns editor controls. Express owns authentication, authorization, persistence, media, publishing jobs and public serving. SQLite avoids external setup locally; the same relational adapter supports PostgreSQL. Filesystem assets and immutable static deployments avoid a proprietary hosting dependency.

The first coherent implementation batch covers create → template → edit → preview → publish → export. Acceptance requires real changes after reload, working undo/redo, mouse/keyboard arrangement, private drafts, cross-user access rejection, independent export rendering, safe failed-publication behavior, recovery and a reproducible self-hosted configuration.

Risks explicitly addressed: editor/public origin isolation, import validation and expanded archive size, asset ownership, save conflicts, deployment activation, DNS TXT proof, certificate authorization, accessible controls and offline recovery. External SMTP, DNS, certificates, PostgreSQL, container runtime and physical-device installation must be verified in their actual environments before production readiness can be claimed.

GitHub inspection found an existing public `Xarber/Persona` Expo starter on master. That repository and its history are preserved. This web implementation uses a separate private development repository, with no public deployment authorized. No native framework migration is performed.
