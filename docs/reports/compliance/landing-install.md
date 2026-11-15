# Persona landing installation verification

Scope covers the web install affordance (§39), service-worker entry (§32), task tracking (§§51–52), and the source gate (§49). Git associates this report with the implementation commit.

- Production web export, TypeScript, formatting, 39 Vitest tests and 11 Chrome Playwright tests passed locally.
- Chrome verified that the first visit receives service-worker control before studio entry. The test injected install events to verify the action calls the prompt and that installation confirmation removes the action. Physical installation and the OS dialog remain unverified.
- The UADS validator passed structural and bundle checks. Initial compressed JavaScript measured 162,375 bytes against a 190,000-byte budget, excluding dynamically loaded chunks.
- The production dependency audit reported zero known vulnerabilities. Changed-line and changed-branch coverage were not measured.
- Persona is public at Xarber/Persona. There were no GitHub Releases at inspection. No native Studio binaries were built.
- X-Center HTTPS and management SSH were unreachable from the workspace. The prior deployment receipt is in the [appliance guide](../../../studio/docs/XCENTER.md). No new rollout was attempted.
