// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest';
import { createDocument, templates } from '../src/shared/templates';
import {
  parseDocument,
  id,
  makeNode,
  findNode,
  moveNode,
  locate,
  cloneNode,
  uniqueSlug,
  resolveStyle,
  documentSchema,
  ideasPackage,
} from '../src/shared/schema';
import { History } from '../src/shared/history';
import { renderPage, siteFiles, styleCSS } from '../src/shared/renderer';
describe('document model and renderer', () => {
  it('serializes all six distinct templates without sharing IDs or state', () => {
    const docs = templates.map((t) => createDocument(t.id));
    for (const doc of docs) expect(parseDocument(JSON.parse(JSON.stringify(doc)))).toEqual(doc);
    expect(new Set(docs.map((d) => d.pages[0].nodes.map((n) => n.type).join(','))).size).toBe(6);
    const a = createDocument(),
      b = createDocument();
    expect(a.pages[0].id).not.toBe(b.pages[0].id);
  });
  it('rejects unsupported schemas, unknown props, malicious URLs and duplicate IDs', () => {
    const doc = createDocument();
    expect(() => parseDocument({ ...doc, schemaVersion: 2 })).toThrow();
    const n = doc.pages[0].nodes[0];
    n.props.url = 'javascript:alert(1)';
    expect(() => parseDocument(doc)).toThrow();
    delete n.props.url;
    doc.pages[0].nodes.push({ ...doc.pages[0].nodes[0] });
    expect(() => parseDocument(doc)).toThrow();
  });
  it('rejects CSS injection, invalid component nesting and duplicate routes', () => {
    const doc = createDocument();
    (doc.theme as any).background = 'red;} body {display:none}';
    expect(documentSchema.safeParse(doc).success).toBe(false);
    const next = createDocument();
    next.pages[0].nodes.push({ ...makeNode('heading'), children: [makeNode('paragraph')] });
    expect(() => parseDocument(next)).toThrow();
    const last = createDocument();
    last.pages.push({ ...structuredClone(last.pages[0]), id: id() });
    expect(() => parseDocument(last)).toThrow();
  });
  it('moves nested nodes without cycles or ID changes', () => {
    const doc = createDocument(),
      p = doc.pages[0];
    const container = p.nodes.find((n) => n.type === 'container')!;
    const child = container.children[0];
    const moved = moveNode(doc, child.id, p.nodes[1].id);
    expect(locate(moved, child.id)?.parent).toBeUndefined();
    expect(findNode(moved.pages[0].nodes, child.id)?.props.text).toBe(child.props.text);
    expect(moveNode(doc, container.id, child.id, true)).toBe(doc);
  });
  it('reorders adjacent siblings in both directions', () => {
    const doc = createDocument();
    const [first, second] = doc.pages[0].nodes;
    const down = moveNode(doc, first.id, second.id);
    expect(down.pages[0].nodes.slice(0, 2).map((node) => node.id)).toEqual([second.id, first.id]);
    const up = moveNode(down, first.id, second.id);
    expect(up.pages[0].nodes.slice(0, 2).map((node) => node.id)).toEqual([first.id, second.id]);
  });
  it('refuses nesting inside leaf nodes and duplicates with independent IDs', () => {
    const doc = createDocument(),
      nodes = doc.pages[0].nodes;
    expect(moveNode(doc, nodes[0].id, nodes[2].id, true)).toBe(doc);
    const copy = cloneNode(nodes.find((n) => n.type === 'container')!);
    expect(copy.children[0].id).not.toBe(nodes.find((n) => n.type === 'container')!.children[0].id);
  });
  it('rejects collection routes that would overwrite another collection export', () => {
    const doc = createDocument();
    doc.collections.awards = [{ ...doc.collections.projects[0], id: id() }];
    expect(() => parseDocument(doc)).toThrow('Duplicate content');
  });
  it('undo and redo restore complete documents and new commands discard redo', () => {
    const doc = createDocument(),
      h = new History(doc);
    h.commit({ ...doc, name: 'New name' });
    expect(h.undo().name).toBe(doc.name);
    expect(h.redo().name).toBe('New name');
    h.undo();
    h.commit({ ...doc, name: 'Other' });
    expect(h.future).toHaveLength(0);
    expect(doc.name).not.toBe('Other');
  });
  it('resolves breakpoint inheritance and permits hiding and revealing', () => {
    const node = makeNode('grid');
    node.style = { columns: 3, padding: 80 };
    node.responsive = { tablet: { columns: 2, padding: 40 }, mobile: { columns: 1, padding: 20 } };
    expect(resolveStyle(node, 'mobile')).toEqual({ columns: 1, padding: 20 });
    expect(resolveStyle(node, 'tablet')).toEqual({ columns: 2, padding: 40 });
    expect(styleCSS({ hidden: false })).toContain('display:revert');
  });
  it('normalizes slugs and resolves collisions', () => {
    expect(uniqueSlug('Café & Design', ['cafe-design'])).toBe('cafe-design-2');
    expect(uniqueSlug('!!!', [])).toBe('page');
  });
  it('escapes untrusted content and never places it in executable scripts', () => {
    const doc = createDocument();
    doc.pages[0].nodes[1].props.text = '<script>alert("x")</script>';
    const html = renderPage(doc);
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>alert');
    expect(html).not.toContain('data-edit=');
    expect(html).not.toContain('contenteditable');
  });
  it('generates static pages, collection detail pages, metadata and scoped offline support', () => {
    const doc = createDocument();
    doc.pages.push({
      id: id(),
      name: 'About',
      slug: 'about',
      visible: true,
      description: 'About this person',
      nodes: [makeNode('heading', { text: 'About' })],
    });
    doc.seo.canonical = 'https://portfolio.example.com';
    const files = siteFiles(doc, { canonical: doc.seo.canonical });
    expect(files['about/index.html']).toContain('../manifest.webmanifest');
    expect(files['projects/common-ground/index.html']).toContain('../../');
    expect(files['sitemap.xml']).toContain('https://portfolio.example.com/about/');
    expect(files['sw.js']).toContain('k.startsWith(PREFIX)');
    expect(files['index.html']).toContain('Contact delivery is not configured');
  });
  it('outputs responsive project columns and hero typography', () => {
    const doc = createDocument();
    const hero = doc.pages[0].nodes.find((n) => n.type === 'hero')!;
    hero.responsive.mobile = { fontSize: 32 };
    const projects = doc.pages[0].nodes.find((n) => n.type === 'projects')!;
    projects.responsive.mobile = { columns: 1 };
    const html = renderPage(doc);
    expect(html).toContain(`h1{font-size:32px;}`);
    expect(html).toContain(`.project-grid{grid-template-columns:repeat(1,minmax(0,1fr))}`);
  });
  it('validates idea interchange and rejects unknown status', () => {
    const idea = {
      id: id(),
      title: 'An idea',
      description: 'A useful thought',
      category: 'Feature',
      priority: 'Normal',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      references: [],
    };
    const pack = {
      schemaVersion: 1,
      project: 'openrecode-persona',
      exportedAt: new Date().toISOString(),
      ideas: [idea],
    };
    expect(ideasPackage.safeParse(pack).success).toBe(true);
    expect(
      ideasPackage.safeParse({ ...pack, ideas: [{ ...idea, status: 'done-ish' }] }).success,
    ).toBe(false);
  });
});
