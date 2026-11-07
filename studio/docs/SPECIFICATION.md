# PROJECT 03 — PERSONA
## Complete Full-Stack Application Development Specification

**Working name:** Persona  
**Tagline:** Your work. Your identity. Your web.  
**Parent initiative:** OpenRecode  
**Application type:** Visual portfolio builder, content management system, and website publishing platform  
**Target platforms:** Web / PWA, responsive desktop and tablet editing, mobile portfolio viewing  
**Status:** New project — implement from the ground up

---

# 1. YOUR ROLE AND MISSION

Act as a complete senior software engineering team comprising:

- Product architect and technical lead.
- Senior React and TypeScript engineer.
- Visual editor and interaction systems engineer.
- Frontend rendering and publishing engineer.
- Backend and database architect.
- UI/UX and design systems specialist.
- Infrastructure and deployment engineer.
- Security, privacy, and accessibility engineer.
- Quality assurance engineer.
- Open-source maintainer and documentation engineer.

Your mission is to **design, implement, test, document, and deliver a fully functional visual portfolio creation platform**.

Do not stop after creating mockups, static layouts, design specifications, pseudocode, or a collection of disconnected UI components.

Create the actual software.

Inspect the workspace before implementing anything.

If Persona already exists, examine and extend the existing project.

If no implementation exists, initialize a new, properly structured project.

If my Universal Application Development Standards (UADS) document is accessible, read and follow it completely.

Preserve its requirements concerning:

- Development conventions.
- Code quality.
- Developer options.
- Ideas management.
- Changelog maintenance.
- Technical documentation.
- Application architecture.

If the original UADS document is unavailable, follow the equivalent requirements in this specification.

Make reasonable design and engineering decisions independently.

Do not interrupt implementation for minor decisions.

Do not deploy publicly, purchase domains, incur paid infrastructure charges, or modify unrelated projects without authorization.

Prioritize real, usable functionality over visually impressive but nonfunctional demonstrations.

# 2. PRODUCT VISION

Persona is an open-source, self-hostable platform for creating beautiful personal portfolios and websites without needing to write code.

It should help people showcase:

- Their identity.
- Their experience.
- Their projects.
- Their skills.
- Their education.
- Their professional achievements.
- Their creative work.
- Their contact information.
- Their personal story.

The platform must support both technical and nontechnical users.

## Core Philosophy

**Create freely. Express yourself. Own your website.**

Most modern website builders restrict users through subscriptions, proprietary hosting, template limitations, or closed publishing systems.

Persona should offer an alternative.

Users should be able to:

1. Select a professionally designed template.
2. Customize its content and visual appearance.
3. Add, remove, and rearrange sections.
4. Preview the website across devices.
5. Publish it through a self-hosted instance.
6. Connect a custom domain.
7. Export their website.
8. Host the exported website independently.
9. Return to the editor and continue making changes.
10. Share the editable project with another Persona installation when supported.

No mandatory subscription.

No advertisements.

No forced platform branding.

No requirement to use a proprietary hosting provider.

The application must feel like a polished consumer design product, not a basic form that produces a generic HTML résumé.

# 3. PRODUCT STRUCTURE

Persona should consist of five integrated systems.

## 3.1 Dashboard

Manage websites, portfolios, templates, assets, and publishing settings.

## 3.2 Visual Builder

Create and customize website layouts using a real interactive editor.

## 3.3 Content Management

Manage projects, skills, experience, education, and reusable portfolio content.

## 3.4 Publishing Engine

Generate performant, accessible websites that can be published or exported.

## 3.5 Site Management

Manage deployment status, domains, SEO, analytics, forms, and settings.

Keep these systems modular.

A portfolio's content and visual design must not be inseparably tied to the editor interface.

# 4. INITIAL USER EXPERIENCE

Implement a clear onboarding experience.

## New User Flow

1. Open Persona.
2. Choose to create an account or continue in a supported local workspace.
3. Select Create Portfolio.
4. Choose a template or blank canvas.
5. Enter optional basic information.
6. Open the visual editor.
7. Customize the website.
8. Preview the result.
9. Publish or export.

Do not require users to complete long setup questionnaires before entering the editor.

Allow users to skip optional profile information.

## Portfolio Creation Methods

Support three creation modes:

**Template-Based:** Start from a professionally designed template.

**Blank Canvas:** Build a portfolio using reusable elements and sections.

**Guided Setup:** Answer a few optional questions and generate a starter website using reusable components.

AI-assisted generation may be introduced as an optional enhancement, but basic site generation must not require AI.

# 5. USER DASHBOARD

Create an elegant website management dashboard.

## Dashboard Features

- List of websites.
- Website thumbnails.
- Last edited timestamp.
- Publishing status.
- Associated domains.
- Template information.
- Quick edit action.
- Preview action.
- Duplicate action.
- Export action.
- Archive or delete action.
- Site settings.

Support multiple websites per user.

## Website Statuses

Suggested statuses:

- Draft.
- Ready to publish.
- Publishing.
- Published.
- Failed.
- Archived.

Clearly distinguish unpublished changes from the currently published version.

## Project Actions

Allow users to:

- Create.
- Rename.
- Duplicate.
- Archive.
- Restore.
- Delete.
- Import.
- Export.

Destructive operations should have appropriate confirmations and recoverability.

## Dashboard Layout

Provide:

- Grid view.
- List view.
- Search.
- Sorting.
- Filters.
- Empty states.
- Recent activity.

Avoid turning the dashboard into an overly complicated enterprise interface.

# 6. VISUAL WEBSITE BUILDER

The visual editor is Persona's primary feature.

It must be a genuinely functional editor, not a static website preview with a few editable text fields.

## 6.1 Editor Layout

Use a professional multi-panel editing environment.

### Left Panel — Structure and Components

Contains:

- Pages.
- Layers.
- Sections.
- Components.
- Assets.
- Content collections.

### Center — Interactive Canvas

Contains the actual website being edited.

The canvas should accurately represent the published layout.

### Right Panel — Inspector

Contains settings for the selected element.

Examples:

- Typography.
- Colors.
- Spacing.
- Dimensions.
- Layout.
- Borders.
- Backgrounds.
- Effects.
- Responsive rules.
- Visibility.
- Interactions.

### Top Toolbar

Contains:

- Website name.
- Save status.
- Undo and redo.
- Device preview selector.
- Zoom.
- Preview.
- Publish.
- Site settings.

Provide resizable panels and collapsible sidebars where practical.

## 6.2 Canvas Editing

Implement:

- Element selection.
- Multi-selection where supported.
- Drag-and-drop placement.
- Reordering.
- Nested containers.
- Duplicate.
- Copy.
- Paste.
- Delete.
- Undo.
- Redo.
- Keyboard shortcuts.
- Context menus.
- Layer selection.
- Hover highlighting.
- Selection outlines.
- Drag insertion indicators.
- Scroll-to-element.
- Zoom-to-fit.

Use a robust drag-and-drop architecture.

Consider maintained tools such as dnd-kit, but verify compatibility before integrating them.

The editor must support mouse and keyboard interaction.

Touch editing should work where practical.

## 6.3 No Accidental Mutations

Selecting an element must not accidentally change its position.

Dragging must provide clear visual feedback.

Prevent invalid nesting or unsupported element combinations.

Keep the editor stable when elements are rapidly added, moved, or deleted.

## 6.4 Direct Text Editing

Allow users to double-click or otherwise activate text editing directly on the canvas.

Support:

- Headings.
- Paragraphs.
- Buttons.
- Navigation labels.
- Lists.
- Captions.
- Rich text where appropriate.

Preserve cursor position and editing state during saves.

Do not rerender the entire editor in ways that interrupt typing.

## 6.5 Autosave

Implement reliable draft autosaving.

Include:

- Visible save state.
- Debounced persistence.
- Failed-save handling.
- Retry.
- Crash recovery.
- Revision history.
- Unsaved-change protection.

Never silently lose a portfolio edit.

# 7. COMPONENT AND SECTION LIBRARY

Provide a professional component library.

## Basic Components

- Text.
- Heading.
- Paragraph.
- Image.
- Video embed.
- Button.
- Link.
- Icon.
- Divider.
- Spacer.
- Container.
- Grid.
- Stack.
- Columns.
- List.
- Card.

## Portfolio Components

- Hero.
- About Me.
- Profile Picture.
- Biography.
- Skills.
- Experience Timeline.
- Education Timeline.
- Project Grid.
- Project Detail.
- Featured Work.
- Testimonials.
- Awards.
- Certifications.
- Social Links.
- Contact Information.
- Contact Form.
- Résumé Download.
- Footer.
- Navigation Bar.

## Advanced Components

- Tabs.
- Accordion.
- Timeline.
- Gallery.
- Image Carousel.
- Statistics.
- Progress Indicators.
- Quote Block.
- Embed.
- Modal where appropriate.
- Custom component wrapper.

Every component should define a clear set of editable properties.

Components must be responsive, accessible, and reusable.

Do not create dozens of decorative components before finishing the core editor.

# 8. SITE DOCUMENT MODEL

Use a structured, versioned document schema as the source of truth for every portfolio.

Do not store the website primarily as arbitrary HTML.

Suggested document representation:

- Site metadata.
- Page definitions.
- Component tree.
- Stable node IDs.
- Component types.
- Component properties.
- Layout constraints.
- Style references.
- Responsive overrides.
- Content references.
- Assets.
- Interactions.
- Theme tokens.
- Schema version.

Each node should have:

- Unique ID.
- Type.
- Parent relationship.
- Ordered children where applicable.
- Editable properties.
- Style definitions.
- Visibility settings.
- Responsive configuration.

## Requirements

Implement:

- Schema validation.
- Serialization.
- Deserialization.
- Migration between schema versions.
- Stable IDs.
- Controlled component registration.
- Unknown component handling.
- Undo/redo operations.
- Revision snapshots.

Avoid executing arbitrary functions embedded in imported document data.

Ensure imported projects cannot bypass the editor's security model.

# 9. DESIGN SYSTEM AND STYLING ENGINE

Persona should offer flexible design control without forcing users to manually specify every CSS property.

## 9.1 Design Tokens

Implement website-level tokens for:

- Primary color.
- Secondary color.
- Accent color.
- Background colors.
- Text colors.
- Font families.
- Font sizes.
- Font weights.
- Border radii.
- Spacing scale.
- Shadows.
- Container widths.
- Breakpoints.

Allow users to edit design tokens globally.

Changes should propagate consistently.

## 9.2 Typography

Support:

- Font family.
- Font size.
- Font weight.
- Line height.
- Letter spacing.
- Text alignment.
- Text transform.
- Decoration.
- Responsive text sizes.

Provide a curated collection of appropriately licensed fonts.

Support custom fonts through validated uploads when feasible.

Ensure exported sites include or correctly reference the fonts they use.

Respect font licensing and do not bundle restricted proprietary fonts without permission.

## 9.3 Layout

Support:

- Flexbox.
- Grid.
- Stacks.
- Columns.
- Containers.
- Gap.
- Padding.
- Margin.
- Alignment.
- Justification.
- Maximum and minimum widths.
- Aspect ratios.
- Positioning where appropriate.

Prefer responsive layout constraints to unrestricted absolute positioning.

Allow advanced positioning when the component and breakpoint behavior are well defined.

## 9.4 Appearance

Support:

- Background colors.
- Gradients.
- Background images.
- Borders.
- Shadows.
- Rounded corners.
- Opacity.
- Simple transforms.
- Hover states.
- Focus states.
- Active states.

Expose advanced settings without overwhelming inexperienced users.

## 9.5 Global Style Editing

Users should be able to change a site's overall appearance from a central theme editor.

Examples:

- Switch from a dark portfolio to a light one.
- Change the accent color throughout the site.
- Modify all heading styles.
- Update card radius globally.
- Change page spacing.

Component-specific overrides should remain possible.

# 10. RESPONSIVE DESIGN SYSTEM

Every generated portfolio must support desktop, tablet, and mobile layouts.

## Responsive Editing

Provide device modes:

- Desktop.
- Tablet.
- Mobile.

Allow users to preview and edit responsive behavior.

Support breakpoint-specific overrides for:

- Layout.
- Spacing.
- Typography.
- Alignment.
- Visibility.
- Grid columns.
- Navigation behavior.
- Image sizing.

## Responsive Behavior

The website must adapt naturally.

Do not generate desktop layouts that merely shrink into unreadable mobile pages.

Implement smart defaults.

Example:

A three-column project grid becomes two columns on tablet and one column on narrow mobile screens.

## Preview Modes

Provide:

- Interactive responsive canvas.
- Fullscreen preview.
- Actual browser-size preview.
- Optional custom viewport dimensions.
- Dark/light preview where the site's theme supports it.

Clearly distinguish editor chrome from published website content.

# 11. TEMPLATE SYSTEM

Templates must be reusable, customizable, and distributable.

## Initial Template Collection

Create at least six genuinely distinct portfolio templates:

### 1. Developer

Dark, technical, modern.

Designed for software engineers and developers.

### 2. Minimal

Clean typography and generous whitespace.

Designed for professionals who prefer simplicity.

### 3. Creative

Expressive layouts and strong visual hierarchy.

Designed for designers, artists, and creative professionals.

### 4. Student

Friendly, approachable, organized.

Designed for students showcasing projects and education.

### 5. Professional

Elegant and formal.

Designed for consultants, researchers, and professional profiles.

### 6. Editorial

Typography-focused, narrative-driven.

Designed for writers, photographers, and content creators.

Do not create six templates that are merely recolored copies of the same layout.

Each template should have a distinct information architecture and visual identity.

## Template Requirements

Every template must:

- Work across supported viewports.
- Be fully editable.
- Use reusable components.
- Respect accessibility.
- Include realistic demo content.
- Have a thumbnail.
- Provide a description.
- Declare its supported schema version.
- Avoid copyrighted assets without appropriate licenses.

## Template Installation

Support:

- Browse templates.
- Preview template.
- Select template.
- Duplicate template.
- Import template package.
- Export template package.

Implement package validation and schema compatibility checks.

## Template Versioning

Updating a template must not unexpectedly overwrite existing customized websites.

A website created from a template should retain its own editable document state.

# 12. CONTENT MANAGEMENT SYSTEM

Separate portfolio content from visual presentation wherever practical.

## Content Types

Support structured information such as:

- Personal profile.
- Projects.
- Skills.
- Employment experience.
- Education.
- Certifications.
- Awards.
- Testimonials.
- Social links.
- Contact details.
- Custom collections.

## Example — Projects

A project can contain:

- ID.
- Title.
- Slug.
- Summary.
- Full description.
- Cover image.
- Gallery.
- Technologies.
- Repository URL.
- Live website URL.
- Start and end dates.
- Status.
- Featured flag.
- Tags.

## Reusable Content

Allow one project entry to appear in multiple locations:

- Homepage featured projects.
- Full projects page.
- Project detail page.
- Related projects section.

Updating the source content should update all linked presentations.

## Content Editing

Provide both:

- Structured content editing.
- Direct canvas editing.

Where a canvas element is bound to structured content, make the relationship clear.

Avoid editing behavior that unexpectedly breaks bindings.

# 13. MULTI-PAGE PORTFOLIOS

Persona must support more than a single scrolling page.

## Page Management

Allow users to:

- Create pages.
- Rename pages.
- Duplicate pages.
- Reorder pages.
- Delete pages.
- Set homepage.
- Configure page slug.
- Configure SEO metadata.
- Define page visibility.
- Edit navigation placement.

## Common Pages

Examples:

- Home.
- About.
- Projects.
- Project Details.
- Experience.
- Résumé.
- Contact.
- Blog or Writing, as an optional extension.

## Navigation

Support:

- Header navigation.
- Footer navigation.
- Mobile navigation menu.
- Internal links.
- External links.
- Anchor links.
- Active-page states.

Ensure routes behave correctly on direct browser navigation and refresh.

## Dynamic Pages

Support generating pages from structured collections.

Example:

/projects  
/projects/unmasked  
/projects/echo  
/projects/persona

Use safe slug generation and collision handling.

# 14. ASSET MANAGEMENT

Provide a proper media library.

## Supported Assets

- Images.
- SVGs under a safe sanitization policy.
- Videos or video references.
- PDF résumés.
- Fonts.
- Icons.
- Other explicitly supported static files.

## Upload Features

Implement:

- Drag-and-drop upload.
- File picker.
- Upload progress.
- Asset previews.
- Search.
- Folders or collections.
- Rename.
- Delete.
- Replace.
- Usage references.
- Metadata editing.

## Image Handling

Support:

- Cropping.
- Focal point selection.
- Aspect ratio.
- Alt text.
- Responsive sizing.
- Compression.
- Thumbnail generation.
- Modern image formats where supported.
- Lazy loading.

Avoid unnecessarily degrading source images.

Preserve original files when appropriate and within configured storage limits.

## Security

Validate:

- File type.
- MIME type.
- File size.
- Filename.
- Content structure.
- User authorization.

Prevent malicious SVG scripts, unsafe uploads, and path traversal.

Do not serve arbitrary user-uploaded executable content under privileged application origins.

# 15. INTERACTIONS AND ANIMATIONS

Support tasteful, accessible website interactions.

Examples:

- Hover effects.
- Button transitions.
- Scroll reveal.
- Fade in.
- Slide in.
- Parallax where appropriate.
- Sticky navigation.
- Animated counters.
- Expandable sections.
- Tabs.
- Accordions.
- Simple page transitions.

## Interaction Editor

Provide configurable triggers:

- Hover.
- Focus.
- Click.
- Page load.
- Scroll into view.

Provide controlled actions:

- Navigate.
- Open external URL.
- Toggle component visibility.
- Run a supported animation.
- Scroll to an anchor.
- Open a supported modal.

Use a declarative and validated interaction schema.

Do not execute arbitrary untrusted JavaScript from imported project documents.

Respect reduced-motion preferences.

Animations must never block access to essential content.

# 16. OPTIONAL CUSTOM CODE

Persona should serve both nontechnical users and developers.

Provide controlled customization options.

## Custom CSS

Allow advanced users to write additional CSS, with clear scope and compatibility rules.

## Custom JavaScript

Custom JavaScript should not be part of the normal visual editor's trusted runtime.

If supported, restrict it to explicitly enabled advanced workflows and isolate it appropriately from editor/admin origins.

Document security implications.

Avoid directly executing arbitrary user-provided scripts within Persona's authenticated application.

## Custom Components

Design a versioned plugin/component API for future extensions.

A custom component may declare:

- Name.
- Version.
- Supported properties.
- Editable fields.
- Rendering implementation.
- Supported interactions.
- Responsive behavior.

Do not permit arbitrary imported plugins to access private application credentials.

Third-party plugins should require explicit trust, appropriate isolation, and documented permission boundaries.

Do not prioritize a full plugin marketplace over the working visual editor.

# 17. SITE PREVIEW SYSTEM

Users must be able to inspect the actual result before publishing.

## Preview Requirements

- Preview draft changes.
- Preview all pages.
- Test navigation.
- Test responsive behavior.
- Test supported interactions.
- Preview forms.
- Preview mobile menus.
- Open preview in a separate tab.

Use an isolated preview environment or iframe where appropriate.

Preview content must not inherit administrator privileges.

A preview of a user-created website must not expose Persona's authentication tokens or internal APIs.

## Draft versus Published

Maintain a clear separation.

Draft changes should not automatically change the publicly available site unless auto-publish has been explicitly enabled.

Provide a visible indicator when unpublished changes exist.

# 18. PUBLISHING ENGINE

Publishing is a core product capability.

Persona must be able to generate real websites, not just display previews inside the editor.

## Publishing Modes

Support at least:

### Self-Hosted Publishing

Publish to the same Persona installation through its configured site delivery infrastructure.

### Static Export

Export a deployable website package containing the necessary HTML, CSS, JavaScript, assets, and configuration.

### External Hosting

Allow exported portfolios to be deployed to compatible static hosting providers.

Provide documentation for common deployment environments.

Optional automated deployment integrations may be added when properly authenticated.

## Rendering Architecture

Prefer a structured rendering pipeline that can produce:

- Editor canvas output.
- Preview output.
- Published website output.
- Static export output.

Use shared components and schemas wherever practical.

Avoid creating separate incompatible website renderers.

## Generated Website Quality

The output should contain:

- Semantic HTML.
- Proper heading hierarchy.
- Responsive styles.
- Correct routing.
- Accessible components.
- SEO metadata.
- Optimized assets.
- Minimal unnecessary JavaScript.

Do not require the entire Persona administration application to load when visiting a published portfolio.

## Static Export Portability

A static export must be independently deployable.

It must not depend on undocumented Persona-hosted services for basic rendering.

If specific features require a backend, clearly identify them.

Example:

A static portfolio may be fully functional while its contact form requires a separately configured endpoint.

Never silently export a broken contact form.

# 19. PUBLISHING WORKFLOW

Implement a reliable publishing process.

## Standard Flow

1. User edits a website.
2. Changes are saved to the draft.
3. User opens preview.
4. User presses Publish.
5. Persona validates the document.
6. Persona generates the production build.
7. Assets are prepared.
8. The deployment is published.
9. The previous public version remains available until the new one is ready.
10. The application reports success or a clear error.

## Required Features

- Publish.
- Republish.
- Unpublish.
- Deployment history.
- Deployment status.
- Build logs with secrets redacted.
- Version rollback.
- Failure recovery.
- Stable public URLs.

A failed publish must not destroy a previously working deployment.

## Deployment Records

Store:

- Deployment ID.
- Website ID.
- Document revision.
- Build version.
- Status.
- Start and completion timestamps.
- Deployment target.
- Resulting URL.
- Non-sensitive error information.

Use immutable published revisions or equivalent deployment artifacts where practical.

# 20. CUSTOM DOMAINS

Implement real custom-domain support.

This must include backend and infrastructure behavior, not merely a text field that stores a domain.

## Domain Management

Allow users to:

- Add a domain.
- View setup instructions.
- Verify ownership.
- Check DNS status.
- View TLS status.
- Set the primary domain.
- Remove a domain.
- Configure redirects.

## Domain Types

Support:

- Subdomains.
- Apex/root domains where compatible with the deployment.
- Persona-managed subdomains on a configured instance domain.

Do not assume every DNS provider supports the same record types.

Provide clear guidance for CNAME, A/AAAA, ALIAS/ANAME, or other compatible configurations as appropriate.

## Ownership Verification

Implement domain ownership verification using a suitable method, such as a unique DNS TXT challenge.

Do not treat a domain as verified merely because its DNS currently points to the server.

Prevent two users from claiming the same domain.

Revalidate ownership and routing state as needed.

## HTTPS

Support automated certificate provisioning and renewal through appropriate infrastructure.

Consider integrating a reverse proxy such as Caddy or Traefik.

Document DNS requirements, certificate issuance limitations, firewall configuration, and operational responsibilities.

## Domain Security

Prevent dangling-domain and subdomain-takeover scenarios.

Define behavior for deleted websites and removed domain assignments.

Ensure tenants cannot use custom domains to claim another tenant's content or redirect traffic without authorization.

Do not claim that arbitrary custom domains will work without DNS configuration.

# 21. SEO AND PUBLIC WEBSITE METADATA

Persona portfolios should be discoverable and professionally presented.

## SEO Features

Support:

- Site title.
- Site description.
- Page titles.
- Page descriptions.
- Canonical URLs.
- Open Graph metadata.
- Social preview images.
- Favicon.
- Robots directives.
- Sitemap generation.
- Structured data where appropriate.
- Human-readable routes.
- Accessible image descriptions.

## SEO Interface

Provide a straightforward SEO settings screen.

Allow users to preview how a page may appear in search results.

Do not promise search engine rankings.

## Search Engine Behavior

Published websites should have meaningful server-rendered or statically generated content where possible.

Avoid relying exclusively on client-side rendering for basic page content.

Draft and preview environments should not be indexed.

# 22. ANALYTICS

Provide optional, privacy-respecting analytics.

## Basic Site Statistics

Potential metrics:

- Page views.
- Unique visitors, estimated without invasive tracking.
- Popular pages.
- Referrers where available.
- Device category.
- Country-level aggregate information where lawful and configured.

Analytics must be disabled by default where appropriate.

Avoid persistent cross-site tracking identifiers.

Do not introduce advertising analytics or third-party trackers by default.

## Privacy Requirements

- Minimize data collection.
- Configure retention.
- Avoid storing raw IP addresses unnecessarily.
- Provide transparent privacy notices.
- Respect applicable consent and legal requirements.
- Document measurement limitations.

For static exports, analytics should remain optional and require separately configured infrastructure.

Do not present invented metrics.

# 23. CONTACT FORMS

Allow users to add a contact form to their portfolio.

## Form Features

- Name.
- Email.
- Message.
- Optional custom fields.
- Validation.
- Submission feedback.
- Accessible error messages.
- Spam prevention.
- Success state.

## Delivery Options

Support configurable submission methods such as:

- Self-hosted form endpoint.
- SMTP delivery.
- Optional supported external provider integration.

Never hardcode an email service provider or require a commercial service.

## Security

Implement:

- Rate limiting.
- CSRF defenses where applicable.
- Input validation.
- Payload size limits.
- Bot prevention.
- Abuse monitoring.
- Safe message formatting.
- Appropriate retention limits.

Do not expose SMTP credentials in generated websites.

If a form has no configured delivery mechanism, the editor must clearly identify it as unconfigured.

# 24. ACCOUNT AND AUTHENTICATION

Persona should support authenticated user workspaces.

## Authentication

Implement:

- Email registration.
- Email verification.
- Secure password hashing.
- Login and logout.
- Password reset.
- Passkeys where supported.
- Multiple sessions.
- Device/session management.
- Session revocation.
- Secure refresh-token rotation.

Optional OAuth providers may be supported when properly configured.

## Workspace Permissions

Initially, each user should own their websites.

Design the schema to accommodate future collaborative workspaces.

Potential future roles:

- Owner.
- Editor.
- Viewer.

Do not implement insecure partial collaboration where users can edit documents without proper authorization.

Every asset, document, domain, and deployment operation must enforce ownership or explicit access permissions.

# 25. LOCAL WORKSPACES AND OFFLINE CAPABILITIES

Persona should permit useful local work without relying constantly on network access.

## Local-Only Mode

Where feasible, allow users to create and edit local drafts without an account.

Store local document state reliably.

Support local export.

## Offline Editing

Implement:

- Cached editor application.
- Local draft persistence.
- Offline change queue.
- Recovery after interruption.
- Clear sync status.
- Conflict awareness.

Publishing naturally requires a configured deployment target and, for remote hosting, network access.

Do not claim remote publication works while fully offline.

## Synchronization

When an authenticated user connects a local workspace to the backend:

- Preserve existing sites.
- Assign stable ownership.
- Upload necessary assets.
- Preserve document revisions.
- Resolve conflicts safely.
- Avoid duplicate websites.

Do not silently discard local work.

# 26. OPTIONAL AI FEATURES

Persona may include optional AI-assisted workflows.

AI must not be required for core site creation or publishing.

## AI-Assisted Content

Possible features:

- Generate a biography draft.
- Rewrite a project description.
- Suggest portfolio structure.
- Improve text clarity.
- Generate SEO descriptions.
- Suggest better section ordering.
- Generate starter copy from user-provided information.

## AI Design Assistance

Future features may include:

- Suggest layouts.
- Recommend color palettes.
- Recommend typography combinations.
- Suggest components.
- Improve accessibility.
- Identify visual inconsistencies.

## Provider Independence

Use a modular AI provider abstraction.

Support provider configuration without hardcoding a commercial dependency.

Never send a user's unpublished portfolio, résumé, personal information, or private assets to an external model without appropriate authorization.

AI output must be reviewed before incorporation.

Do not fabricate professional experience, achievements, employers, testimonials, or projects.

## AI-Based Portfolio Setup

If implemented, a user may provide:

"I am a software developer who wants a dark, modern portfolio highlighting my applications and GitHub projects."

Persona may generate an editable initial design using existing component schemas.

Avoid generating unsafe arbitrary application code.

# 27. DESIGN IMPORT AND EXPORT

Users must be able to retain editable ownership of their projects.

## Editable Project Export

Implement a Persona project format.

Suggested package:

- Manifest.
- Schema version.
- Site document.
- Theme tokens.
- Content collections.
- Asset manifest.
- Included assets.
- Template metadata.
- Optional history metadata.

Export as a portable archive.

## Project Import

Allow users to import a project from another compatible Persona installation.

Validate:

- Manifest structure.
- Schema version.
- Asset references.
- Component types.
- File sizes.
- Package integrity.
- Path safety.
- Unsupported features.

Provide migration where appropriate.

## Static Website Export

Provide a separate deployable website export.

Do not confuse an editable Persona project archive with a production static website.

Both must be available.

## Future Importers

Architect for possible imports from:

- Plain HTML/CSS.
- Markdown content.
- Structured JSON.
- Existing résumé/profile formats.

Do not promise lossless conversion from arbitrary website builders.

# 28. TEMPLATE AND COMPONENT EXTENSIBILITY

Design an open extension architecture.

## Template Packages

Allow contributors to create new themes/templates using the documented schema and supported components.

## Component Registry

Maintain a versioned registry for built-in components.

Each component should declare:

- Identifier.
- Display name.
- Category.
- Configurable properties.
- Allowed children.
- Default values.
- Responsive behavior.
- Rendering implementation.
- Validation.
- Editor inspector controls.

## Compatibility

Handle unsupported component versions gracefully.

Avoid importing executable plugins automatically.

Require clear trust boundaries for third-party component packages.

## Open-Source Contributions

Document how contributors can:

- Add a template.
- Add a component.
- Update component properties.
- Add rendering tests.
- Add inspector controls.
- Test responsiveness.
- Submit a pull request.

# 29. SECURITY ARCHITECTURE

Persona processes user-authored content, uploaded files, and public websites.

Treat this as a multi-tenant security-sensitive application.

## Core Security

Implement:

- HTTPS.
- Secure authentication.
- Authorization.
- Strict input validation.
- Output encoding.
- Safe HTML rendering.
- CSRF protection where appropriate.
- XSS prevention.
- Rate limiting.
- Safe file uploads.
- Security headers.
- Secure session management.
- Sensitive data redaction.
- Server-side asset permissions.
- Deployment isolation.

## Editor Isolation

The editing interface must be protected from untrusted site content.

Use appropriate preview isolation.

Do not grant user-authored websites direct access to admin application cookies, tokens, or privileged browser contexts.

## Publishing Isolation

Published websites should be separated from the management application through suitable origins and infrastructure boundaries.

Avoid allowing a user's published page to execute privileged code in the same origin as the Persona administration interface.

## Custom Code

If custom HTML, CSS, or JavaScript is supported, apply appropriate trust and isolation policies.

Do not assume sanitization alone makes arbitrary JavaScript safe.

## Multi-Tenant Authorization

Verify ownership for:

- Websites.
- Pages.
- Assets.
- Templates where private.
- Content collections.
- Domains.
- Deployments.
- Analytics.
- Contact submissions.

Prevent insecure direct object references.

# 30. PRIVACY AND DATA OWNERSHIP

Persona must follow OpenRecode's privacy principles.

## Requirements

- No advertising trackers.
- No sale of user data.
- No forced platform branding.
- No mandatory public profile.
- No hidden AI processing.
- No unnecessary retention.
- No publishing without explicit action.
- No public access to drafts.
- No unauthorized sharing of project assets.

## User Controls

Provide:

- Account export.
- Website export.
- Asset export.
- Account deletion.
- Website deletion.
- Domain removal.
- Analytics opt-in/out.
- AI configuration.
- Session revocation.

Document data retention and backup behavior.

## Public Content

Remind users that deliberately published website content is publicly accessible.

Provide clear separation between:

- Public portfolio content.
- Private draft content.
- Account information.
- Deployment credentials.
- Internal analytics.

Design toward GDPR-aligned privacy principles without claiming legal certification.

# 31. FRONTEND TECHNOLOGY STACK

Preferred stack:

- React.
- TypeScript.
- Next.js or an appropriate modern React framework.
- Tailwind CSS or an equivalent maintainable styling system.
- A maintained accessible component library.
- Zustand or an equivalent local editor state solution.
- TanStack Query for remote state.
- dnd-kit or another mature drag-and-drop solution.
- React Hook Form and schema validation where useful.
- A suitable rich-text editor such as TipTap, after verifying current compatibility.

Select maintained versions appropriate to the implementation environment.

Do not depend on experimental APIs without a concrete reason.

## Frontend Architecture

Separate:

- Editor UI.
- Document state.
- Command history.
- Canvas renderer.
- Published renderer.
- Inspector controls.
- Component registry.
- Theme engine.
- Content management.
- API client.
- Asset management.

The editor should not become one enormous component.

## Rendering

Build a deterministic component-rendering system.

A component should render consistently in:

- Editor.
- Preview.
- Published website.
- Exported website.

The editor may wrap components with controls, but those controls must not appear in the output.

# 32. BACKEND TECHNOLOGY STACK

Preferred:

- Node.js.
- TypeScript.
- PostgreSQL.
- Prisma or another mature database abstraction.
- Redis where genuinely useful.
- S3-compatible asset storage.
- A background worker for publishing jobs.
- A suitable job queue.
- Object storage or filesystem-backed publication artifacts, according to deployment mode.

Avoid requiring proprietary hosted infrastructure.

## Suggested Monorepo Structure

/apps/editor  
/apps/api  
/apps/publisher  
/apps/worker  
/packages/ui  
/packages/components  
/packages/renderer  
/packages/document-schema  
/packages/templates  
/packages/shared  
/packages/database  
/packages/config  
/infra  
/docs

Adapt the structure when a simpler architecture is more appropriate.

Do not create unnecessary packages purely for organizational appearance.

# 33. DATABASE SCHEMA

Design a coherent, versioned schema.

Suggested entities:

- User
- UserProfile
- AuthSession
- Workspace
- WorkspaceMember
- Website
- WebsiteSettings
- WebsiteDocument
- WebsiteRevision
- Page
- ContentCollection
- ContentItem
- ContentField
- Asset
- AssetReference
- Template
- TemplateVersion
- Deployment
- DeploymentArtifact
- Domain
- DomainVerification
- CertificateStatus
- FormDefinition
- FormSubmission
- AnalyticsConfiguration
- AnalyticsAggregate
- AIConfiguration
- AuditEvent
- DeveloperIdea

These are conceptual models, not a requirement to create a separate database table for every property.

Use JSON fields appropriately for structured editor documents while retaining relational constraints for ownership, revisions, and publication.

## Database Requirements

- Stable IDs.
- Unique constraints.
- Indexed lookups.
- Transactional publishing metadata.
- Document revisions.
- Migration support.
- Appropriate cascading behavior.
- Recoverable deletion where necessary.
- Audit trails for sensitive operations.

# 34. API DESIGN

Create a typed API with consistent validation and authorization.

Illustrative endpoints:

## Websites

GET /websites  
POST /websites  
GET /websites/:id  
PATCH /websites/:id  
DELETE /websites/:id

## Documents

GET /websites/:id/document  
PATCH /websites/:id/document  
GET /websites/:id/revisions  
POST /websites/:id/revisions/:revisionId/restore

## Templates

GET /templates  
GET /templates/:id  
POST /templates/import

## Assets

GET /assets  
POST /assets  
DELETE /assets/:id

## Publishing

POST /websites/:id/publish  
POST /websites/:id/unpublish  
GET /websites/:id/deployments  
POST /websites/:id/deployments/:deploymentId/rollback

## Domains

GET /websites/:id/domains  
POST /websites/:id/domains  
POST /domains/:id/verify  
DELETE /domains/:id

## Exports

POST /websites/:id/export/project  
POST /websites/:id/export/static

## Forms

POST /public/forms/:formId/submit

Implement versioning and authorization appropriate to each endpoint.

Provide OpenAPI documentation or equivalent typed API contracts.

# 35. UADS DEVELOPER OPTIONS

Every OpenRecode application requires developer options.

Persona must implement a developer settings area containing:

- Application version.
- Build information.
- Backend environment.
- Feature flags.
- Cache diagnostics.
- Database schema version.
- Rendering engine version.
- Publishing diagnostics.
- Asset processing status.
- Template compatibility diagnostics.
- Changelog.
- Developer Ideas.

Never display secrets in production diagnostics.

## Developer Ideas Page

Implement a dedicated Ideas page for Persona development suggestions.

This page is not the same as a user's portfolio content collection.

Each developer idea should have:

- Unique ID.
- Title.
- Description.
- Category.
- Priority.
- Status.
- Created timestamp.
- Updated timestamp.
- Optional screenshot.
- Related module.
- Implementation notes.

Statuses:

- New.
- Under consideration.
- Approved.
- In progress.
- Implemented.
- Deferred.
- Rejected.

Actions:

- Create.
- Edit.
- Delete.
- Search.
- Filter.
- Sort.
- Export JSON.
- Import JSON.
- Deduplicate.
- Link implemented ideas to changelog entries.

Follow existing UADS conventions if available.

## Changelog

Maintain a structured changelog.

Categories:

- Added.
- Changed.
- Fixed.
- Security.
- Removed.

Associate meaningful implemented ideas with relevant entries.

# 36. OPENRECODE REQUIREMENTS

Persona is part of the OpenRecode initiative.

It must be:

- Open-source.
- Free to use.
- Self-hostable.
- Forkable.
- Extensible.
- Community-maintainable.
- Free of advertisements.
- Free of mandatory proprietary hosting.
- Independent of paid subscriptions for core functionality.

Consider an AGPLv3 license after validating dependency compatibility and legal suitability.

Avoid licensing language that falsely claims third-party assets are covered by the application's license.

## Required Repository Files

README.md  
LICENSE  
CONTRIBUTING.md  
CODE_OF_CONDUCT.md  
SECURITY.md  
CHANGELOG.md  
.env.example  
docs/ARCHITECTURE.md  
docs/EDITOR.md  
docs/COMPONENTS.md  
docs/TEMPLATES.md  
docs/PUBLISHING.md  
docs/DOMAINS.md  
docs/DEPLOYMENT.md  
docs/API.md  
docs/PRIVACY.md  
docs/ROADMAP.md

## Self-Hosting

Provide a practical deployment solution using Docker Compose.

Support:

- Application frontend.
- Backend.
- Database.
- Asset storage.
- Publishing worker.
- Reverse proxy.
- Optional Redis.
- Persistent storage.

Document environment variables, required ports, backups, database migrations, and production security requirements.

Be transparent that hosting and domain registration may have external costs even when Persona itself is free.

# 37. INTEROPERABILITY WITH OPENRECODE

Design Persona to integrate optionally with other OpenRecode projects.

## Echo Integration

Allow users to explicitly import developed project descriptions, biographies, and content from Echo.

Do not automatically access private diary entries.

## Unmasked Integration

Potential future support for public contact links or profile information authorized by the user.

Do not expose private messaging data.

## School Manager Integration

Potential future support for student project showcases or educational portfolios.

## General Rules

- No required cross-application dependency.
- Explicit authorization.
- Versioned import/export formats.
- No silent synchronization of personal data.
- Separate account credentials unless a deliberate shared identity system is implemented.

Persona must work independently.

# 38. TESTING REQUIREMENTS

Build a meaningful automated testing suite.

## Unit Tests

Cover:

- Document serialization.
- Schema validation.
- Component properties.
- Tree operations.
- Undo/redo.
- Responsive style resolution.
- Slug generation.
- Template installation.
- Import/export validation.
- Permission checks.
- Domain verification state.

## Integration Tests

Cover:

- Account registration.
- Site creation.
- Draft saving.
- Revision history.
- Asset uploads.
- Template installation.
- Publishing.
- Deployment rollback.
- Domain assignment.
- Form submissions.
- Account deletion.

## End-to-End Tests

Use tools such as Playwright where appropriate.

Test:

1. Open Persona.
2. Create a website.
3. Select a template.
4. Edit the hero heading.
5. Add a project section.
6. Upload an image.
7. Reorder sections.
8. Change theme colors.
9. Preview mobile layout.
10. Save the draft.
11. Reload the page.
12. Verify changes persist.
13. Publish the website.
14. Open the public URL.
15. Verify the website matches the saved publication.
16. Export a static package.
17. Run the exported site independently.

## Editor Tests

Test:

- Drag-and-drop reliability.
- Invalid nesting prevention.
- Selection.
- Copy/paste.
- Undo/redo.
- Keyboard shortcuts.
- Responsive overrides.
- Large documents.
- Revision restore.
- Autosave failures.

## Security Tests

Test:

- Cross-user access rejection.
- Malicious imported documents.
- Unsafe SVG uploads.
- XSS injection attempts.
- Unverified custom domains.
- Unauthorized deployment.
- Publishing isolation.
- Invalid component schemas.
- Rate-limited form abuse.

## Accessibility Tests

Test keyboard navigation, semantic output, component labels, and important WCAG accessibility expectations.

Do not rely on automated accessibility scans alone.

# 39. PERFORMANCE REQUIREMENTS

Aim for:

- Responsive editor interactions.
- Smooth canvas navigation.
- Fast document loading.
- Efficient autosaving.
- Minimal unnecessary rerenders.
- Efficient component-tree updates.
- Optimized assets.
- Fast published page loads.
- Good Core Web Vitals where measurable.
- Low JavaScript overhead on published websites.
- Responsive layouts on lower-powered mobile devices.

Use lazy loading and code splitting where appropriate.

Publishing should happen without freezing the editor.

Do not invent benchmark results.

Document actual measurements when testing is available.

# 40. IMPORTANT USER SCENARIOS

## Scenario A — Student Portfolio

A student opens Persona.

They choose the Student template.

They enter:

- Their display name.
- A short introduction.
- Skills.
- School projects.
- Contact links.

They customize the accent color.

They add a project gallery.

They preview the website on mobile.

They publish it.

The public website works independently of the editor.

## Scenario B — Developer Portfolio

A developer selects the Developer template.

They add several software projects.

Each project includes:

- Name.
- Description.
- Technologies.
- Screenshots.
- Repository.
- Demo link.

They add a custom page for each project.

They edit the overall typography and color palette.

They export the website.

The exported files can be deployed to an independent static host.

## Scenario C — Custom Domain

A user publishes a portfolio.

They open Domain Settings.

They enter:

portfolio.example.com

Persona generates domain verification instructions.

The user configures DNS.

Persona validates ownership.

The domain is assigned to the website.

TLS is configured through the deployment infrastructure.

The user can access the portfolio using HTTPS.

Removing the domain cleanly removes its assignment.

## Scenario D — Publishing Rollback

A user publishes a working website.

They make several changes.

They publish again.

The new deployment encounters a problem.

The original deployment remains available or can be restored.

The user selects an earlier version.

Persona rolls back safely.

## Scenario E — Visual Editing

A user opens a portfolio.

They add a section.

They drag a project grid beneath the hero.

They change its layout.

They duplicate a project card.

They undo the duplication.

They edit a heading.

They reload the editor.

Their changes remain intact.

## Scenario F — Independent Hosting

A user exports their completed website.

They deploy it outside Persona.

The site loads correctly.

Images and styles render.

Navigation works.

No Persona account or active Persona backend is necessary for the site's basic static functionality.

Any optional backend-dependent features are explicitly documented.

# 41. IMPLEMENTATION PHASES

Execute the project incrementally.

## Phase 1 — Foundation

- Inspect workspace.
- Choose architecture.
- Initialize project.
- Configure TypeScript.
- Create database schema.
- Configure authentication.
- Establish component registry.
- Implement site document format.
- Create basic dashboard.

## Phase 2 — Working Visual Editor

- Canvas.
- Layers.
- Component selection.
- Inspector.
- Basic components.
- Drag-and-drop.
- Component tree editing.
- Undo/redo.
- Autosave.
- Responsive preview.

This phase must deliver a functioning editor.

## Phase 3 — Templates and Content

- Template engine.
- Initial templates.
- Content collections.
- Structured projects.
- Theme tokens.
- Asset management.
- Multi-page navigation.

## Phase 4 — Publishing

- Shared rendering engine.
- Production output.
- Static export.
- Published revision snapshots.
- Deployment management.
- Rollback.
- Public website serving.

## Phase 5 — Domains and Website Tools

- Custom domains.
- Ownership verification.
- TLS integration.
- SEO.
- Contact forms.
- Basic privacy-friendly analytics.

## Phase 6 — Advanced Editing

- More components.
- Interactive components.
- Animation configuration.
- Advanced responsive controls.
- Version history.
- Project import/export.
- Custom CSS.

## Phase 7 — Production Readiness

- Security review.
- Accessibility.
- Performance optimization.
- Automated tests.
- Documentation.
- Self-hosting.
- CI.
- Open-source preparation.

## Phase 8 — Optional Enhancements

- AI assistance.
- Collaboration.
- External deployment integrations.
- Community component packages.
- Advanced plugin architecture.

Do not prioritize optional enhancements over a functioning editor and publishing pipeline.

Complete working vertical slices instead of producing a broad set of incomplete features.

# 42. FINAL DELIVERABLES

Deliver:

1. Functional Persona source code.
2. Working dashboard.
3. Working visual editor.
4. Component library.
5. Theme engine.
6. Responsive layout editing.
7. Template library.
8. Content management system.
9. Asset management.
10. Multi-page websites.
11. Preview system.
12. Publishing engine.
13. Static website export.
14. Deployment history.
15. Rollback support.
16. Custom domain management.
17. SEO controls.
18. Contact form functionality.
19. Privacy controls.
20. Account authentication.
21. Developer options.
22. UADS Ideas page.
23. Changelog.
24. Automated tests.
25. Docker-based self-hosting.
26. Documentation.
27. Build instructions.
28. Known limitations and roadmap.

Provide exact commands for:

- Installing dependencies.
- Configuring environment variables.
- Starting local development.
- Running database migrations.
- Running tests.
- Starting the publishing worker.
- Running production builds.
- Exporting a website.
- Starting the self-hosted stack.
- Configuring custom domains.

Document which features require external DNS, certificates, credentials, or infrastructure configuration.

# 43. DEFINITION OF DONE

The project is not complete because a portfolio template is visible.

The minimum acceptance criteria are:

- A user can create a website.
- A user can choose a template.
- A user can edit content visually.
- A user can add and remove components.
- A user can rearrange sections.
- A user can customize the design.
- A user can preview responsive layouts.
- Changes persist after a reload.
- Undo and redo function correctly.
- A user can publish a website.
- The public website works.
- A user can export a deployable static website.
- An exported website renders independently.
- Unauthorized users cannot edit someone else's website.
- Site drafts are protected from unauthorized access.
- Core functionality has automated tests.
- The application can run using the documented self-hosted setup.

Domain management must have a real verification and routing architecture, even if a real external domain cannot be tested without DNS access.

Clearly distinguish:

- Implemented and verified.
- Implemented but not externally tested.
- Partially implemented.
- Planned.
- Blocked.

Never report a decorative control as functioning.

# 44. EXECUTION DIRECTIVE

Begin implementation immediately.

Inspect the available development environment.

Establish the project architecture and database.

Implement the core visual editor and document model before adding secondary features.

Create a complete end-to-end workflow:

Create Website → Select Template → Edit → Preview → Publish → Export.

Verify that this workflow genuinely works.

Then expand the component library, responsive controls, content management, domains, and advanced functionality.

Run tests, identify defects, fix errors, and document limitations.

Do not stop at the planning stage.

Do not replace the visual editor with a static form-driven template generator.

Do not use rasterized screenshots as substitutes for functional websites.

Do not require proprietary hosting or paid subscriptions for essential features.

Maintain clean code, readable architecture, and developer documentation.

**Final objective: deliver a beautiful, powerful, open-source portfolio creation platform where anyone can build, customize, publish, export, and independently host a professional website without giving up ownership of their work.**