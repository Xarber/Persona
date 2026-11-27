# Persona repository guide

Persona Studio is a local-first portfolio editor with an optional connected
workspace for publishing and cross-device access. The Studio is a React/Vite
web app and an Express service under `studio/`. The repository root contains
the earlier Expo starter. See [Expo starter scope](EXPO_STARTER.md) for its
relationship to the Studio.

| Area | Start here |
| --- | --- |
| Studio features and module entry points | [Studio index](../studio/docs/INDEX.md) and [architecture](../studio/docs/ARCHITECTURE.md) |
| Editor, templates, and documents | [Editor](../studio/docs/EDITOR.md) and [data model](../studio/docs/DATA_MODEL.md) |
| Authentication, data ownership, and consent | [Security](../studio/docs/SECURITY.md) and [X-Center ID](../studio/docs/features/XCENTER_ID.md) |
| Development and verification | [Development](../studio/docs/DEVELOPMENT.md) and [testing](../studio/docs/TESTING.md) |
| Hosting and recovery | [X-Center](../studio/docs/XCENTER.md) and [disaster recovery](operations/DISASTER_RECOVERY.md) |
| Current work and evidence | [Active queue](ACTIVE_TASKS.md) and [UADS requirements](UADS_REQUIREMENTS.md) |

Use Node 24 and run `npm ci` inside `studio/`. Use `npm run check` and
`npm test` for focused verification. See the development guide for the browser
runtime and UADS build requirements before starting a full build.
