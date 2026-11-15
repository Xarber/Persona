# Persona UADS registry

Baseline: sections 1–52 supplied by the owner, recorded on 15 November 2026. The standards remain authoritative. These initial entries group related checks; full atomic traceability remains pending.

- `UADS-PLAT-001`: Supported web and native targets (§10,36). native starter has no Persona editor.
- `UADS-ARCH-001`: Shared document and rendering architecture (§2,3,12,13). shared renderer and isolated publisher.
- `UADS-GIT-001`: Repository and promotion policy (§6,7,34). testing integration; master retained.
- `UADS-DOC-001`: Project and license documentation (§1,4,5). studio documentation and AGPL license.
- `UADS-UI-001`: WCAG 2.2 AA and responsive controls (§17,18,36,42). browser checks cover only selected interactions.
- `UADS-UI-002`: Motion and reduced motion (§18,36). reduced-motion browser assertion.
- `UADS-UI-003`: First-visit landing and install flow (§32,36,39). landing and programmable PWA install implemented. Physical installation and release discovery remain pending.
- `UADS-DEV-001`: Developer Options and diagnostics (§15,38). hosted profile intentionally hides developer controls per deployment request.
- `UADS-DEV-002`: Ideas lifecycle and interchange (§35). browser Ideas tests cover persistence and expiry.
- `UADS-DEV-003`: Onboarding, screenshots, isolated sample data (§20,33,37). onboarding, screenshot tooling and sample mode pending.
- `UADS-SEC-001`: Authorization, privacy and trust boundaries (§21,43). API tests cover selected authorization paths.
- `UADS-QA-001`: CI quality, accessibility and coverage (§22,23,42,48,49). source checks configured; changed-code coverage and accessibility audit pending.
- `UADS-QA-002`: Performance budgets (§42). bundle limit enforced; field and backend measurements pending.
- `UADS-REL-001`: Build, changelog and recoverable publication (§8,9,16,24,40,44). web validation workflow; no authorized GitHub artifact release pipeline.
- `UADS-DIST-001`: Updates and distribution synchronization (§14,25,31,39,40). PWA update flow exists; no native distribution.
- `UADS-OPS-001`: X-Center health and operations (§24,36,45). live health verification and restore evidence tracked separately.
- `UADS-DATA-001`: Provenance and sample isolation (§19,20,37). sample mode pending.
- `UADS-QA-003`: Schema, traceability and evidence management (§41,46,47,48,49,50,51,52). Track scope, evidence and next actions in [the active queue](ACTIVE_TASKS.md).
