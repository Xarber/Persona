# Security architecture

## Trust boundaries

The administration application and published websites use separate listeners and production origins. Cookies are host-only, HttpOnly, SameSite=Strict and Secure in production. Account passwords use salted scrypt. Only SHA-256 hashes of random session/reset/challenge tokens are stored. Private routes check authenticated ownership rather than accepting a client-supplied owner ID. API mutations require an exact allowed Origin. Session revocation and password reset invalidate server records.

WebAuthn uses SimpleWebAuthn 14: RP ID and expected origin are configured from APP_ORIGIN, user verification is required, challenges expire and are consumed once, and credential counters update conditionally. SMTP links use high-entropy tokens with bounded expiration and generic password-request responses. Email verification is optional when no SMTP is configured; do not treat an unverified address as verified identity. Passkey authenticator flows still need device/browser verification beyond invalid-response tests.

Imported projects are data, never executable packages. Zod rejects arbitrary props, unsafe URL schemes and unsupported node types. Text is HTML-escaped; styles use a whitelist. Canvas/preview frames are opaque-origin sandboxes and communicate through checked window/channel pairs. The output contains only host-controlled interaction scripts. Arbitrary JavaScript, HTML embeds, custom font files and SVG uploads are deliberately unsupported.

## Media and package limits

Uploads are limited to 12 MB; images decode with a 40-megapixel limit, rotate/resize and re-encode to WebP. Original bytes are retained outside privileged document routes. PDF headers are checked and API responses use attachment/sandbox headers. Generated files are UUID-named. Private asset references are checked against the owner before save/build/export. The library caps at 500 assets/256 MB and accounts at 100 websites; these controls are not a substitute for instance-wide disk monitoring.

Editable ZIPs are bounded by compressed size, entry count, per-entry expanded size and total expanded size before extraction. Asset digests must match; files are never extracted to arbitrary supplied paths. Imports do not enable code. The initial UI import of local project packages follows equivalent document and image validation, although a malicious browser user can always modify their own local IndexedDB.

## Publishing and domains

Published artifacts are immutable, prepared before activation, and served through database pointers. Failed jobs preserve working publications. Public contact forms require a published contact component, bounded input, rate limiting and an empty honeypot; messages are private and rendered as text in the inbox. Forms are intentionally public submission endpoints and do not receive account privileges.

DNS ownership uses unique TXT proof, not routing alone. CNAME routing and freshness are checked independently. The Caddy certificate ask endpoint cannot authorize arbitrary hostnames without an active publication and recent ownership proof. Removing assignments revokes application routing. See DOMAINS.md for apex and external-testing limitations.

## Operator requirements and residual risks

Use HTTPS, separate hostnames, closed registration where appropriate, encrypted backups and an unprivileged runtime. Only the proxy should be network-exposed in production. The bundled configuration overwrites forwarded headers; enable TRUST_PROXY only behind that trusted single hop. Do not place editor and user content on the same origin.

Rate limits are process-local; a multi-replica deployment needs shared abuse controls. Current worker recovery supports one worker, not distributed leases. Outbound media URLs may disclose a visitor's network address to their chosen provider; only uploaded/copied assets are guaranteed self-contained. SVG/script rejection and security tests are targeted controls, not a claim of a complete penetration test. Dependency audit results are recorded in reports/VALIDATION.md, not assumed permanent.
