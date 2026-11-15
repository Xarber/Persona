# Persona active tasks

Scope comes from the original Studio brief, the subsequent request to verify browser and native behavior, the authorized X-Center publication, and the current UADS (§§51–52). The Studio roadmap expands the authoring backlog. Git history records order within each item.

| ID | Order and priority | Task and dependencies | Status and evidence |
| --- | --- | --- | --- |
| PERSONA-001 | 1 · high | Build the portfolio Studio and finish remaining editor, asset, publishing and synchronization work | In Progress. The create/edit/publish/export path exists. See [roadmap](../studio/docs/ROADMAP.md) for outstanding implementation and [test inventory](../studio/docs/TESTING.md). |
| PERSONA-002 | 2 · high | Verify real browser use and provide mobile counterparts where supported | In Progress. Responsive browser editor exists (92ee8ab). Physical PWA installation and upgrade are unverified. The root Expo app is a starter. A native Studio target is a prerequisite for native package workflows. |
| PERSONA-003 | 3 · high | Publish on X-Center with dedicated production service and built-in endpoints | Blocked for refresh and live revalidation. The public repository and dedicated deployment were verified at 998b4eb. Current HTTPS is unreachable from this environment. Recheck appliance reachability and disk before staging another build. See [hosting and rollback](../studio/docs/XCENTER.md). |
| PERSONA-004 | 4 · high | Verify builds and maintain UADS quality checks and objective evidence | In Progress. Bootstrap at 8a6f88a. Source-only checks run on testing pushes. Coverage, broader security and accessibility evidence remain open. See [requirements](UADS_REQUIREMENTS.md). |
| PERSONA-005 | 5 · normal | Bring first-visit installation, onboarding and capture tooling up to current UADS | In Progress. Root landing and remembered entry exist. Landing install action is implemented. First-run onboarding, isolated screenshot fixtures and reproducible captures remain to be implemented. Native release downloads depend on a native Studio target and published artifacts. |
| PERSONA-006 | 6 · normal | Complete developer tooling, changelog and release verification | Queued. Device-local Ideas require an authorized export. The repository Ideas collection is empty. The hosted profile intentionally hides developer controls per the production request. Review developer server switching in the self-hosted profile and release metadata against the [roadmap](../studio/docs/ROADMAP.md). |

X-Center revalidation can resume when it is reachable. Browser changes can be built and verified locally while it is unavailable.
