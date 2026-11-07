# Custom domains and TLS

Set `DOMAIN_TARGET` to the public delivery hostname. The bundled Compose proxy uses `SITES_HOST` for that target. Configure the editor on a separate hostname (`APP_HOST`); these origins must differ. Custom domains must never resolve the authenticated editor listener.

1. Publish a website and add a hostname in Site settings → Domains.
2. Add a TXT record at `_persona.HOSTNAME` containing the exact generated `persona-verify=...` value.
3. For a subdomain, add a CNAME from HOSTNAME to DOMAIN_TARGET.
4. Click Verify DNS. TXT proves ownership; CNAME separately confirms routing. A CNAME alone never establishes ownership.
5. With ports 80/443 routed to the bundled Caddy instance, request the hostname over HTTPS. Caddy's on-demand TLS ask endpoint allows issuance only for recently verified, routed domains with an active, unarchived publication.

Verification expires after seven days. While the worker runs, maintenance checks verified domains older than one day every six hours, with a bounded batch. Loss of TXT proof revokes the assignment's verified state. After worker downtime or temporary DNS errors, reverify manually. The application checks freshness during delivery and certificate authorization, so stale entries fail closed. DNS checks are not claims that a certificate was issued: the UI explicitly reports that TLS is managed by the proxy and not measured by Persona.

Domains are globally unique and capped at ten per website. The instance's own administrative/public hostnames cannot be claimed. Removing an assignment immediately denies serving; remove the corresponding DNS records as well. Deleting or archiving a site prevents public resolution. No fallback routes a removed custom domain into the administration app.

Apex/root domains require provider-specific ALIAS/ANAME flattening or operator-provided A/AAAA records. Current automatic routing verification checks CNAME. Apex certificate/routing support is therefore an operator integration task, not a completed one-click workflow. Primary-domain selection and canonical redirects are not yet automated; set the canonical base URL in SEO and configure an approved proxy redirect explicitly.

External DNS propagation, public ACME issuance/renewal, a real custom hostname and takeover resistance across real DNS providers have not been verified without external domain access. Mocked DNS tests exercise positive/negative ownership, expiry and routing authorization.
