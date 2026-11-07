// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { id, parseDocument, type SiteDocument, type Website, type Idea } from '../shared/schema';
import { createDocument } from '../shared/templates';
let dbPromise: Promise<IDBDatabase>;
function database() {
  return (dbPromise ??= new Promise((resolve, reject) => {
    const r = indexedDB.open('persona-workspace', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  }));
}
export async function read<T>(key: string): Promise<T | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const r = db.transaction('kv').objectStore('kv').get(key);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function write(key: string, value: unknown) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
export async function remove(key: string) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
export class RequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T = unknown>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const r = await fetch(`/api${url}`, {
    method,
    credentials: 'same-origin',
    headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });
  const result = await r.json();
  if (!r.ok) throw new RequestError(r.status, result.error || 'Request failed.');
  return result;
}
export interface User {
  id: string;
  email: string;
}
export class Workspace {
  constructor(public user: User | null) {}
  get key() {
    return this.user?.id || 'local';
  }
  async list(): Promise<Website[]> {
    if (!this.user) return (await read<Website[]>('local-sites')) || [];
    try {
      const sites = await api<Website[]>('/websites');
      await write(`cached-sites:${this.key}`, sites);
      return sites;
    } catch (error) {
      if (!navigator.onLine || error instanceof TypeError)
        return (await read<Website[]>(`cached-sites:${this.key}`)) || [];
      throw error;
    }
  }
  async get(siteId: string): Promise<Website> {
    if (this.user) {
      try {
        const site = await api<Website>(`/websites/${siteId}`);
        const cached = (await read<Website[]>(`cached-sites:${this.key}`)) || [];
        await write(`cached-sites:${this.key}`, [site, ...cached.filter((s) => s.id !== siteId)]);
        return site;
      } catch (error) {
        if (navigator.onLine && !(error instanceof TypeError)) throw error;
        const cached = ((await read<Website[]>(`cached-sites:${this.key}`)) || []).find(
          (s) => s.id === siteId,
        );
        if (!cached) throw Error('This website has not been cached on this device.');
        return cached;
      }
    }
    const s = (await this.list()).find((s) => s.id === siteId);
    if (!s) throw Error('Website not found in this workspace.');
    return s;
  }
  async create(
    name: string,
    template: string,
    person?: string,
    document?: SiteDocument,
  ): Promise<Website> {
    if (this.user)
      return api('/websites', 'POST', {
        name,
        template: template === 'blank' ? 'blank' : template,
        person,
        document,
      });
    const doc = parseDocument(document || createDocument(template, name, person));
    const time = new Date().toISOString();
    const site: Website = {
      id: id(),
      name: doc.name,
      document: doc,
      version: 1,
      publishedVersion: null,
      deploymentId: null,
      archived: false,
      createdAt: time,
      updatedAt: time,
    };
    await write('local-sites', [site, ...(await this.list())]);
    await write('revisions:' + site.id, [{ version: 1, document: doc, created_at: time }]);
    return site;
  }
  async save(site: Website, doc: SiteDocument, archived?: boolean): Promise<Website> {
    parseDocument(doc);
    if (this.user)
      return api(`/websites/${site.id}`, 'PATCH', {
        version: site.version,
        document: doc,
        archived,
      });
    const sites = await this.list();
    const existing = sites.find((s) => s.id === site.id);
    if (existing && existing.version !== site.version)
      throw new RequestError(409, 'This website changed in another window.');
    const next = {
      ...site,
      document: doc,
      name: doc.name,
      version: site.version + 1,
      archived: archived ?? site.archived,
      updatedAt: new Date().toISOString(),
    };
    await write(
      'local-sites',
      sites.map((s) => (s.id === site.id ? next : s)),
    );
    const revisions = (await read<unknown[]>('revisions:' + site.id)) || [];
    await write(
      'revisions:' + site.id,
      [{ version: next.version, document: doc, created_at: next.updatedAt }, ...revisions].slice(
        0,
        100,
      ),
    );
    return next;
  }
  async delete(site: Website) {
    if (this.user) return api(`/websites/${site.id}`, 'DELETE', { confirm: site.name });
    await write(
      'local-sites',
      (await this.list()).filter((s) => s.id !== site.id),
    );
    await remove('revisions:' + site.id);
  }
  private syncingIdeas: Promise<void> | null = null;
  get ideasKey() {
    return this.user ? `ideas:${this.key}` : 'ideas';
  }
  async pendingIdeas() {
    return (
      (await read<Record<string, { idea?: Idea; deleted?: boolean; baseUpdatedAt?: string }>>(
        `ideas-queue:${this.key}`,
      )) || {}
    );
  }
  async syncIdeas() {
    if (!this.user || !navigator.onLine) return;
    if (this.syncingIdeas) return this.syncingIdeas;
    this.syncingIdeas = (async () => {
      const remote = await api<Idea[]>('/ideas'),
        queue = await this.pendingIdeas();
      for (const [ideaId, op] of Object.entries(queue)) {
        const existing = remote.find((i) => i.id === ideaId);
        // Preserve conflicting copies for explicit review/export, never overwrite a remote change.
        if (
          existing &&
          existing.updatedAt !== op.baseUpdatedAt &&
          JSON.stringify(existing) !== JSON.stringify(op.idea)
        )
          continue;
        if (op.deleted) {
          if (existing) await api(`/ideas/${ideaId}`, 'DELETE');
        } else if (op.idea) {
          if (existing)
            await api(`/ideas/${ideaId}`, 'PATCH', {
              idea: op.idea,
              baseUpdatedAt: existing.updatedAt,
            });
          else
            await api('/ideas', 'PUT', {
              schemaVersion: 1,
              project: 'openrecode-persona',
              exportedAt: new Date().toISOString(),
              ideas: [op.idea],
            });
        }
        delete queue[ideaId];
        await write(`ideas-queue:${this.key}`, queue);
      }
      const latest = await api<Idea[]>('/ideas');
      const pending = await this.pendingIdeas();
      const merged = new Map(latest.map((i) => [i.id, i]));
      for (const [ideaId, op] of Object.entries(pending)) {
        if (op.deleted) merged.delete(ideaId);
        else if (op.idea) merged.set(ideaId, op.idea);
      }
      await write(this.ideasKey, [...merged.values()]);
    })();
    try {
      await this.syncingIdeas;
    } finally {
      this.syncingIdeas = null;
    }
  }
  async ideas(): Promise<Idea[]> {
    if (this.user) {
      try {
        await this.syncIdeas();
      } catch (error) {
        if (navigator.onLine && !(error instanceof TypeError)) throw error;
      }
    }
    return (await read<Idea[]>(this.ideasKey)) || [];
  }
  async saveIdea(idea: Idea, existing = false) {
    const list = (await read<Idea[]>(this.ideasKey)) || [],
      previous = list.find((i) => i.id === idea.id);
    const history = [...(previous?.history || idea.history || [])];
    if (!previous || previous.status !== idea.status)
      history.push({
        at: idea.updatedAt,
        status: idea.status,
        note: previous ? `Status changed from ${previous.status}` : 'Idea recorded',
      });
    const next = { ...idea, history: history.slice(-500) };
    await write(this.ideasKey, [next, ...list.filter((i) => i.id !== idea.id)]);
    if (this.user) {
      const queue = await this.pendingIdeas();
      queue[idea.id] = {
        idea: next,
        baseUpdatedAt: queue[idea.id]?.baseUpdatedAt ?? previous?.updatedAt,
      };
      await write(`ideas-queue:${this.key}`, queue);
      try {
        await this.syncIdeas();
      } catch (error) {
        if (navigator.onLine && !(error instanceof TypeError)) throw error;
      }
    }
  }
  async deleteIdea(ideaId: string) {
    const list = (await read<Idea[]>(this.ideasKey)) || [],
      previous = list.find((i) => i.id === ideaId);
    await write(
      this.ideasKey,
      list.filter((i) => i.id !== ideaId),
    );
    if (this.user) {
      const queue = await this.pendingIdeas();
      queue[ideaId] = {
        deleted: true,
        baseUpdatedAt: queue[ideaId]?.baseUpdatedAt ?? previous?.updatedAt,
      };
      await write(`ideas-queue:${this.key}`, queue);
      try {
        await this.syncIdeas();
      } catch (error) {
        if (navigator.onLine && !(error instanceof TypeError)) throw error;
      }
    }
  }
}
export function download(data: Blob | string, name: string, type = 'application/json') {
  const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
export async function localExport(doc: SiteDocument, project = false) {
  const { default: JSZip } = await import('jszip');
  const { siteFiles, siteIconFor, portfolioWorker } = await import('../shared/renderer');
  const { localAssets, documentAssetIds } = await import('./media');
  const zip = new JSZip(),
    assets = await localAssets(),
    manifest = [];
  const ids = documentAssetIds(doc);
  for (const assetId of ids) {
    const a = assets.find((a) => a.id === assetId);
    if (!a) throw Error('An attached asset is missing from this local workspace.');
    const bytes = await a.data.arrayBuffer();
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    manifest.push({ id: a.id, mime: a.mime, sha256: digest });
    zip.file(
      project
        ? `assets/${a.id}`
        : `assets/${a.id}.${a.mime === 'application/pdf' ? 'pdf' : 'webp'}`,
      bytes,
    );
  }
  if (project)
    zip.file(
      'persona.json',
      JSON.stringify(
        { format: 'persona-project', schemaVersion: 1, document: doc, assets: manifest },
        null,
        2,
      ),
    );
  else {
    for (const [name, text] of Object.entries(siteFiles(doc))) {
      const base = '../'.repeat(name.split('/').length - 1) || './';
      const html = text.replace(
        /\/api\/assets\/([\w-]+)\/file/g,
        (_, assetId) =>
          `${base}assets/${assetId}.${assets.find((a) => a.id === assetId)?.mime === 'application/pdf' ? 'pdf' : 'webp'}`,
      );
      zip.file(name, html);
    }
    for (const size of [180, 192, 512]) {
      const svg = new Blob([siteIconFor(doc)], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svg);
      try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(Error('Icon export failed'));
          img.src = url;
        });
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        canvas.getContext('2d')!.drawImage(img, 0, 0, size, size);
        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), 'image/png'),
        );
        zip.file(size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`, blob);
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    zip.file(
      'sw.js',
      portfolioWorker(
        doc,
        Object.keys(zip.files).filter((name) => name !== 'sw.js'),
      ),
    );
    zip.file(
      'README.txt',
      'Serve this folder on any static HTTP host. Contact forms need a configured email. No Persona backend is required for rendering.',
    );
  }
  download(
    await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }),
    `${doc.name}-${project ? 'project' : 'static'}.zip`,
  );
}
