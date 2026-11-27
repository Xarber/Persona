# Persona X-Center ID verification

Reviewed on 27 November 2026 for UADS §§12, 21, 24, 42–43 and 51. The exact
source revision is the commit that introduces this report.

- The live issuer’s discovery passed using the pinned managed Node SDK. The
  authorization request reached the provider's sign-in flow with HTTP 303 for
  `https://persona.xcenter.it/api/account/callback`. An earlier probe of
  `/api/xcenter/callback` returned HTTP 400. The owner supplied the registered
  path and the implementation now mounts on it.
- Forty unit and API tests passed. The X-Center test uses an isolated SQLite
  database and a simulated provider exchange. It checks session-bound linking,
  origin enforcement, replay rejection, encrypted grant storage, linked sign-in,
  private writes with an expected revision, project ZIP generation and unlink.
- Type checking, formatting, the UADS manifest validator, and production
  dependency audit passed. The audit reported zero known vulnerabilities.
- The public Persona health check reported `998b4eb`. The live callback
  returned HTTP 404 on that revision. The new callback still requires staging,
  hosted validation and promotion. The Developer Portal required sign-in.
  Real user consent, OAuth exchange, data writes, service-key provisioning and
  physical authentication devices remain unverified.
