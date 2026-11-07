# Extension architecture

The built-in component registry, shared schema, theme model, structured collections and deterministic renderer are the current extension points. Their contract version is 1. Templates are data-only documents; imported packages cannot install code, access cookies, register arbitrary event handlers or read private database rows.

To add a trusted built-in component, extend schema/registry/renderer/inspector/tests together. Keep domain logic and persistence behind server interfaces. A future component/plugin manifest should declare version, host compatibility, capabilities, controlled UI contributions, storage/network permissions and lifecycle. Executable third-party extensions require a separately reviewed isolation design, explicit user trust and revocation.

A plugin installer, marketplace, unrestricted runtime, permission dashboard and hot-swappable application screens are not implemented. The architecture permits those features to be added without storing arbitrary functions inside portfolio documents. No prohibited or hidden runtime is included for a store variant; native store variants are outside this web project's supported distribution.
