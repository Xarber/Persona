// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { z } from 'zod';
export const id = () => crypto.randomUUID();
export const slug = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70) || 'page';
export function uniqueSlug(value: string, existing: string[]) {
  const base = slug(value);
  let out = base,
    i = 2;
  while (existing.includes(out)) out = `${base}-${i++}`;
  return out;
}
export const kinds = [
  'container',
  'stack',
  'grid',
  'heading',
  'paragraph',
  'image',
  'button',
  'divider',
  'spacer',
  'navigation',
  'hero',
  'projects',
  'timeline',
  'skills',
  'quote',
  'contact',
  'footer',
  'accordion',
  'video',
  'gallery',
  'statistics',
] as const;
export type Kind = (typeof kinds)[number];
const color = z.string().regex(/^(#[0-9a-fA-F]{3,8}|transparent)$/);
export const styleSchema = z
  .object({
    color: color.optional(),
    background: color.optional(),
    fontSize: z.number().min(8).max(200).optional(),
    fontWeight: z.number().min(100).max(900).optional(),
    lineHeight: z.number().min(0.8).max(3).optional(),
    letterSpacing: z.number().min(-10).max(30).optional(),
    padding: z.number().min(0).max(240).optional(),
    margin: z.number().min(0).max(240).optional(),
    gap: z.number().min(0).max(120).optional(),
    radius: z.number().min(0).max(200).optional(),
    columns: z.number().int().min(1).max(6).optional(),
    maxWidth: z.number().min(40).max(2400).optional(),
    minHeight: z.number().min(0).max(1600).optional(),
    opacity: z.number().min(0).max(1).optional(),
    align: z.enum(['left', 'center', 'right']).optional(),
    justify: z.enum(['start', 'center', 'end', 'space-between']).optional(),
    direction: z.enum(['row', 'column']).optional(),
    border: z.boolean().optional(),
    shadow: z.boolean().optional(),
    hidden: z.boolean().optional(),
    aspectRatio: z.enum(['auto', '1/1', '4/3', '16/9', '3/4']).optional(),
    objectPosition: z.enum(['center', 'top', 'bottom', 'left', 'right']).optional(),
  })
  .strict();
export type Style = z.infer<typeof styleSchema>;
export const safeUrl = (v: string) =>
  !v || (/^(https?:\/\/|mailto:|tel:|#|\/(?!\/)|\.\.?\/)/i.test(v) && !/[\u0000-\u0020\\]/.test(v));
const url = z.string().max(2000).refine(safeUrl, 'Use an https, mailto, tel or relative URL');
const propsSchema = z
  .object({
    text: z.string().max(20000).optional(),
    eyebrow: z.string().max(200).optional(),
    subtitle: z.string().max(4000).optional(),
    url: url.optional(),
    src: url.optional(),
    alt: z.string().max(500).optional(),
    label: z.string().max(200).optional(),
    collection: z.string().max(100).optional(),
    email: z.email().or(z.literal('')).optional(),
    animation: z.enum(['none', 'fade', 'rise']).optional(),
    items: z
      .array(
        z.object({ title: z.string().max(300), text: z.string().max(5000), url: url.optional() }),
      )
      .max(100)
      .optional(),
  })
  .strict();
export interface SiteNode {
  id: string;
  type: Kind;
  props: z.infer<typeof propsSchema>;
  style: Style;
  responsive: { tablet?: Style; mobile?: Style };
  children: SiteNode[];
}
export const nodeSchema: z.ZodType<SiteNode> = z.lazy(() =>
  z
    .object({
      id: z.string().uuid(),
      type: z.enum(kinds),
      props: propsSchema,
      style: styleSchema,
      responsive: z
        .object({ tablet: styleSchema.optional(), mobile: styleSchema.optional() })
        .strict(),
      children: z.array(nodeSchema).max(200),
    })
    .strict(),
);
export const containers: Kind[] = ['container', 'stack', 'grid', 'hero', 'footer'];
export const itemSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().max(300),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .max(80),
    summary: z.string().max(5000),
    body: z.string().max(20000),
    image: url,
    url: url,
    tags: z.array(z.string().max(80)).max(30),
    featured: z.boolean(),
  })
  .strict();
export const documentSchema = z
  .object({
    schemaVersion: z.literal(1),
    name: z.string().min(1).max(120),
    template: z.string().max(100),
    description: z.string().max(1000),
    theme: z
      .object({
        background: color,
        surface: color,
        text: color,
        muted: color,
        accent: color,
        secondary: color,
        font: z.enum(['sans', 'serif', 'mono']),
        radius: z.number().min(0).max(64),
        spacing: z.number().min(16).max(160),
        width: z.number().min(600).max(1800),
      })
      .strict(),
    pages: z
      .array(
        z
          .object({
            id: z.string().uuid(),
            name: z.string().min(1).max(100),
            slug: z
              .string()
              .regex(/^[a-z0-9-]*$/)
              .max(80),
            description: z.string().max(1000),
            visible: z.boolean(),
            nodes: z.array(nodeSchema).max(200),
          })
          .strict(),
      )
      .min(1)
      .max(30),
    collections: z.record(
      z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .max(80),
      z.array(itemSchema).max(300),
    ),
    seo: z
      .object({
        indexable: z.boolean(),
        canonical: z
          .string()
          .max(1000)
          .refine((v) => !v || (/^https?:\/\//.test(v) && safeUrl(v))),
        image: url,
      })
      .strict(),
  })
  .strict()
  .superRefine((doc, ctx) => {
    const ids = new Set<string>();
    let count = 0;
    const walk = (nodes: SiteNode[], depth: number) => {
      if (depth > 12) {
        ctx.addIssue({ code: 'custom', message: 'Maximum nesting depth is 12' });
        return;
      }
      for (const n of nodes) {
        count++;
        if (ids.has(n.id)) ctx.addIssue({ code: 'custom', message: 'Duplicate node ID' });
        ids.add(n.id);
        if (n.children.length && !containers.includes(n.type))
          ctx.addIssue({ code: 'custom', message: 'This component cannot contain children' });
        walk(n.children, depth + 1);
      }
    };
    const slugs = new Set<string>();
    for (const p of doc.pages) {
      if (ids.has(p.id) || slugs.has(p.slug))
        ctx.addIssue({ code: 'custom', message: 'Duplicate page ID or slug' });
      ids.add(p.id);
      slugs.add(p.slug);
      walk(p.nodes, 0);
    }
    if (!slugs.has('')) ctx.addIssue({ code: 'custom', message: 'A homepage is required' });
    if (count > 1500) ctx.addIssue({ code: 'custom', message: 'Maximum 1500 nodes' });
    const s = new Set<string>();
    for (const list of Object.values(doc.collections)) {
      for (const item of list) {
        if (s.has(item.slug) || ids.has(item.id))
          ctx.addIssue({ code: 'custom', message: 'Duplicate content ID or slug' });
        s.add(item.slug);
        ids.add(item.id);
      }
    }
  });
export type SiteDocument = z.infer<typeof documentSchema>;
export type ContentItem = z.infer<typeof itemSchema>;
export type Device = 'desktop' | 'tablet' | 'mobile';
export function parseDocument(input: unknown): SiteDocument {
  // Version dispatch is explicit; future versions must supply a migration.
  return documentSchema.parse(input);
}
export function findNode(nodes: SiteNode[], nodeId: string): SiteNode | undefined {
  for (const n of nodes) {
    if (n.id === nodeId) return n;
    const found = findNode(n.children, nodeId);
    if (found) return found;
  }
}
export function allNodes(doc: SiteDocument): SiteNode[] {
  const result: SiteNode[] = [];
  const walk = (ns: SiteNode[]) => {
    for (const n of ns) {
      result.push(n);
      walk(n.children);
    }
  };
  doc.pages.forEach((p) => walk(p.nodes));
  return result;
}
export function locate(
  doc: SiteDocument,
  nodeId: string,
): { siblings: SiteNode[]; index: number; parent?: SiteNode } | undefined {
  const walk = (ns: SiteNode[], parent?: SiteNode): ReturnType<typeof locate> => {
    const index = ns.findIndex((n) => n.id === nodeId);
    if (index >= 0) return { siblings: ns, index, parent };
    for (const n of ns) {
      const found = walk(n.children, n);
      if (found) return found;
    }
  };
  for (const p of doc.pages) {
    const l = walk(p.nodes);
    if (l) return l;
  }
}
export function cloneNode(n: SiteNode): SiteNode {
  return { ...structuredClone(n), id: id(), children: n.children.map(cloneNode) };
}
export function moveNode(
  doc: SiteDocument,
  nodeId: string,
  targetId: string,
  inside = false,
): SiteDocument {
  const next = structuredClone(doc),
    a = locate(next, nodeId),
    b = locate(next, targetId);
  if (!a || !b || nodeId === targetId) return doc;
  const moving = a.siblings[a.index];
  if (findNode(moving.children, targetId)) return doc;
  if (inside && !containers.includes(b.siblings[b.index].type)) return doc;
  const movingDown = a.siblings === b.siblings && a.index < b.index;
  a.siblings.splice(a.index, 1);
  const dest = locate(next, targetId)!;
  if (inside) dest.siblings[dest.index].children.push(moving);
  else dest.siblings.splice(dest.index + (movingDown ? 1 : 0), 0, moving);
  return parseDocument(next);
}
export function resolveStyle(node: SiteNode, device: Device): Style {
  return {
    ...node.style,
    ...(device !== 'desktop' ? node.responsive.tablet : {}),
    ...(device === 'mobile' ? node.responsive.mobile : {}),
  };
}
export const registry: Record<
  Kind,
  { label: string; category: string; defaults: SiteNode['props'] }
> = {
  container: { label: 'Container', category: 'Layout', defaults: {} },
  stack: { label: 'Stack', category: 'Layout', defaults: {} },
  grid: { label: 'Grid', category: 'Layout', defaults: {} },
  heading: { label: 'Heading', category: 'Basic', defaults: { text: 'A little more about me' } },
  paragraph: {
    label: 'Paragraph',
    category: 'Basic',
    defaults: {
      text: 'Tell your story. Share what you care about, what you make, and where you want to go next.',
    },
  },
  image: { label: 'Image', category: 'Basic', defaults: { alt: 'Describe this image', src: '' } },
  button: {
    label: 'Button',
    category: 'Basic',
    defaults: { text: 'Get in touch', url: 'mailto:hello@example.com' },
  },
  divider: { label: 'Divider', category: 'Layout', defaults: {} },
  spacer: { label: 'Spacer', category: 'Layout', defaults: {} },
  navigation: { label: 'Navigation', category: 'Portfolio', defaults: { text: 'Your name' } },
  hero: {
    label: 'Hero',
    category: 'Portfolio',
    defaults: {
      eyebrow: 'AVAILABLE FOR GOOD THINGS',
      text: 'Make space for\nyour next chapter.',
      subtitle: 'A thoughtful introduction to the work you love and the person behind it.',
    },
  },
  projects: {
    label: 'Project grid',
    category: 'Portfolio',
    defaults: { text: 'Selected work', collection: 'projects' },
  },
  timeline: {
    label: 'Timeline',
    category: 'Portfolio',
    defaults: {
      text: 'The journey so far',
      items: [
        { title: '2024 — Now', text: 'Building things that matter.' },
        { title: '2021 — 2024', text: 'Learning, experimenting, growing.' },
      ],
    },
  },
  skills: {
    label: 'Skills',
    category: 'Portfolio',
    defaults: {
      text: 'A few things I do',
      items: [
        { title: 'Design', text: '' },
        { title: 'Development', text: '' },
        { title: 'Strategy', text: '' },
      ],
    },
  },
  quote: {
    label: 'Quote',
    category: 'Portfolio',
    defaults: { text: 'Great work starts with curiosity.', subtitle: 'A principle I work by' },
  },
  contact: {
    label: 'Contact form',
    category: 'Portfolio',
    defaults: {
      text: 'Let’s make something meaningful.',
      subtitle: 'Have a question or a project in mind? Send a note.',
    },
  },
  footer: { label: 'Footer', category: 'Portfolio', defaults: { text: 'Made with intention.' } },
  accordion: {
    label: 'Accordion',
    category: 'Interactive',
    defaults: {
      text: 'Frequently asked',
      items: [
        {
          title: 'What are you working on?',
          text: 'A selection of independent projects and collaborations.',
        },
      ],
    },
  },
  video: {
    label: 'Video',
    category: 'Media',
    defaults: { text: 'Watch the story', src: '', alt: 'Video' },
  },
  gallery: { label: 'Gallery', category: 'Media', defaults: { text: 'Visual notes', items: [] } },
  statistics: {
    label: 'Statistics',
    category: 'Portfolio',
    defaults: {
      items: [
        { title: '12', text: 'Independent projects' },
        { title: '5', text: 'Years of curiosity' },
      ],
    },
  },
};
export function makeNode(type: Kind, props: SiteNode['props'] = {}): SiteNode {
  return {
    id: id(),
    type,
    props: { ...structuredClone(registry[type].defaults), ...props },
    style: {},
    responsive: {},
    children: [],
  };
}
export interface Website {
  id: string;
  name: string;
  document: SiteDocument;
  version: number;
  publishedVersion: number | null;
  deploymentId: string | null;
  archived: boolean;
  updatedAt: string;
  createdAt: string;
}
export const ideaSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().min(1).max(300),
    description: z.string().max(10000),
    category: z.enum(['Feature', 'Improvement', 'Bug Fix', 'UI/UX', 'Performance', 'Other']),
    priority: z.enum(['Low', 'Normal', 'High']),
    status: z.enum(['Pending', 'Approved', 'Deferred', 'In Progress', 'Implemented', 'Rejected']),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    references: z.array(z.string().max(300)).max(30),
    history: z
      .array(
        z
          .object({
            at: z.iso.datetime(),
            status: z.enum([
              'Pending',
              'Approved',
              'Deferred',
              'In Progress',
              'Implemented',
              'Rejected',
            ]),
            note: z.string().max(1000),
          })
          .strict(),
      )
      .max(500)
      .optional(),
  })
  .strict();
export type Idea = z.infer<typeof ideaSchema>;
export const ideasPackage = z
  .object({
    schemaVersion: z.literal(1),
    project: z.literal('openrecode-persona'),
    exportedAt: z.iso.datetime(),
    ideas: z.array(ideaSchema).max(1000),
  })
  .strict();
export const release = {
  version: '0.1.0',
  date: '2026-11-06',
  highlights: [
    {
      icon: 'PanelsTopLeft',
      title: 'A home for your work',
      description: 'Six editable starting points, a visual canvas and responsive design tools.',
    },
    {
      icon: 'PackageOpen',
      title: 'Take your website with you',
      description: 'Publish immutable snapshots and export independent static websites.',
    },
  ],
  fixes: ['Private workspaces, revision recovery and portable project files.'],
};
