# Controlled component registry

Registry API 1 lives in `src/shared/schema.ts`. Each built-in defines type, display name, category and default properties; the schema and renderer explicitly support its contract. Adding a component requires updating the enum, property schema if needed, registry, renderer branch, inspector affordances and tests. Data-only imports cannot register JavaScript.

| Group | Implemented components |
| --- | --- |
| Basic | Heading, paragraph, image, button |
| Layout | Container, stack, grid, divider, spacer |
| Portfolio | Navigation, hero, project grid, timeline, skills, quote, contact, footer, statistics |
| Media | Video with direct file URL, gallery |
| Interactive | Native accessible accordion |

Container, stack, grid, hero and footer accept children. Other types are leaves. Lists within timelines, skills, galleries, accordions and statistics use validated item arrays. The item editor accepts `title | description | optional URL`, one per line. Project grids bind to named collections; changing an entry updates every bound grid and generated detail page.

Buttons support safe links; navigation includes a native details/summary mobile menu. Forms have labeled fields, validation, a honeypot, rate-limited self-hosted submission and explicit feedback. Exported contacts use an email link or an unconfigured notice instead of silently depending on Persona.

Hero/quote content is plain text with line breaks. Video does not embed arbitrary iframe providers. Basic fade/rise animations run on page load and respect reduced motion. Unsupported custom code, tabs, carousels, modals and advanced trigger/action authoring are not represented by decorative controls.
