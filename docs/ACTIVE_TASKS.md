# Persona active tasks

Scope comes from the original Studio brief, the subsequent request to verify browser and native behavior, the authorized X-Center publication, and the current UADS (§§51–52). The Studio roadmap expands the authoring backlog. Git history records order within each item.

| ID | Order and priority | Task and dependencies | Status and evidence |
| --- | --- | --- | --- |
| PERSONA-001 | 1 · high | Build the portfolio Studio and finish remaining editor, asset, publishing and synchronization work | In Progress. The create/edit/publish/export path exists. Page ordering is implemented and passed a Chrome regression covering navigation order, undo/redo and reopening. A separate page navigation label is implemented for both menus. Desktop and mobile renderer tests passed. Chrome at 390 px verified opening the mobile menu and its custom current-page link. Next, verify label editing in the mobile Studio and continue the remaining editor roadmap. See [roadmap](../studio/docs/ROADMAP.md) for outstanding implementation and [test inventory](../studio/docs/TESTING.md). |
| PERSONA-002 | 2 · high | Verify real browser use and provide mobile counterparts where supported | In Progress. Responsive browser editor exists (92ee8ab). Physical PWA installation and upgrade are unverified. The root Expo app is a starter. A native Studio target is a prerequisite for native package workflows. |
| PERSONA-003 | 3 · high | Publish on X-Center with dedicated production service and built-in endpoints | In Progress. The public repository and dedicated deployment were verified at 998b4eb. HTTPS health and management access recovered. Next, stage the hosted build on isolated loopback ports, check disk headroom and retain rollback before promoting. See [hosting and rollback](../studio/docs/XCENTER.md). |
| PERSONA-004 | 4 · high | Verify builds and maintain UADS quality checks and objective evidence | In Progress. Bootstrap at 8a6f88a. Source-only checks run on testing pushes. Coverage, broader security and accessibility evidence remain open. See [requirements](UADS_REQUIREMENTS.md). |
| PERSONA-005 | 5 · normal | Bring first-visit installation, onboarding and capture tooling up to current UADS | In Progress. Root landing and remembered entry exist. Landing install action is implemented. First-run onboarding, isolated screenshot fixtures and reproducible captures remain to be implemented. Native release downloads depend on a native Studio target and published artifacts. |
| PERSONA-006 | 6 · normal | Complete developer tooling, changelog and release verification | Queued. Device-local Ideas require an authorized export. The repository Ideas collection is empty. The hosted profile intentionally hides developer controls per the production request. Review developer server switching in the self-hosted profile and release metadata against the [roadmap](../studio/docs/ROADMAP.md). |

| PERSONA-007 | 7 · normal. Advanced at the user's request | Integrate X-Center ID for settings sync, portfolio sync, service data, and saving exports to global files. Implement the backend at the registered callback. | Implemented for source validation. The managed SDK creates the OIDC flow and the issuer accepted the exact HTTPS callback path. Settings and portfolio copies require `app_data`, global exports require `files_write`, and private deployment records require an administrator-verified database key. The root-only appliance configuration is prepared. The next hosted step is to stage the gated configuration at the exact callback and test real consent, token exchange, and storage with an isolated account. Session renewal, service-key verification, and media restore across separate Studio instances remain open. |

X-Center revalidation can resume when it is reachable. Browser changes can be built and verified locally while it is unavailable.

## Usage checkpoint — 26 November 2026

UADS §0 paused new work at 05:39 CET. The five-hour window had 0% remaining and resets on 26 November at 09:58 CET. The weekly window had 41% remaining with no reset credits, below the 55% minimum for the time remaining. Its scheduled reset is 2 December at 15:33 CET. Recheck both windows before resuming.

- The source branch was synchronized at `6ec7df3`. Four browser-report PNGs were already modified in the working tree. Review their provenance before including them in any commit.
- PERSONA-001 resumes with a focused mobile page-navigation regression on the existing build, then the separate navigation label. The desktop page-order regression passed. The interrupted broader browser run lacks a confirmed final result.
- PERSONA-003 has an existing candidate image for `6ec7df3`. The prior staging probe received a connection reset before health could be confirmed. Check the live deployment and reuse the existing image for an isolated staging retry with readiness polling and container logs. Assess §§8, 24 and 43 before any new build or promotion.
- Preserve PERSONA-002 and PERSONA-004 through PERSONA-006. Apply the revised onboarding, screenshot provenance, and changelog requirements in §§16–17, 37, 40 and 44 to the relevant queue items when work resumes.


## X-Center ID continuation — 27 November 2026

The user prioritized PERSONA-007 and supplied the callback pattern
`<service>.xcenter.it/api/account/callback`. Persona mounts the corresponding
backend route at `https://persona.xcenter.it/api/account/callback`.
The issuer returned 303 into its authorization flow for that exact URL.
The developer portal required a signed-in browser session. Administrator
verification and a service database key are still unverified. The prior candidate
image predates the integration and cannot validate the new callback.
Under UADS §8, finish independent preparation and source work before building
a new hosted candidate. See [integration details](../studio/docs/features/XCENTER_ID.md).

## Usage checkpoint — 27 November 2026

UADS §0 paused new work at 13:28 CET. The five-hour window had 7% remaining
and resets on 27 November at 18:16 CET. The weekly window had 43% remaining,
with zero reset credits, and resets on 3 December at 12:07 CET. Recheck both
windows before starting new work.

- PERSONA-007 source validation passed. The new callback and protected
  appliance configuration are ready for staging. Production still returns 404
  on this route. Live consent, token exchange, synchronized storage, global
  Files, and the administrator-verified service database key remain open.
- Resume by checking the latest source CI run and exercising the custom
  navigation label in the mobile Studio browser editor. Continue independent
  work in queue order before staging the hosted candidate under §8. Then test
  the exact public callback and account flows using isolated test data.
- The four pre-existing screenshot changes remain outside the commits.
