// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { mkdir, writeFile, readFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { dataDir, query, run } from './db';
import { allNodes, parseDocument, type SiteDocument } from '../shared/schema';
import { siteFiles, siteIconFor, portfolioWorker } from '../shared/renderer';
export const uploads = path.join(dataDir, 'uploads'),
  artifacts = path.join(dataDir, 'deployments');
export const publicOrigin = () => process.env.PUBLIC_ORIGIN || 'http://localhost:3101';
export class AssetAccessError extends Error {}
export async function ownerAssets(doc: SiteDocument, userId: string) {
  const urls = new Set<string>();
  for (const n of allNodes(doc)) {
    if (n.props.src) urls.add(n.props.src);
    if (n.props.url) urls.add(n.props.url);
    for (const i of n.props.items || []) if (i.url) urls.add(i.url);
  }
  for (const list of Object.values(doc.collections))
    for (const i of list) {
      if (i.image) urls.add(i.image);
      if (i.url) urls.add(i.url);
    }
  if (doc.seo.image) urls.add(doc.seo.image);
  const assets = [];
  for (const url of urls) {
    const match = url.match(/^\/api\/assets\/([\w-]+)\/file$/);
    if (!match) continue;
    const [asset] = await query<{ id: string; filename: string; mime: string }>(
      'SELECT id,filename,mime FROM assets WHERE id=? AND user_id=?',
      [match[1], userId],
    );
    if (!asset) throw new AssetAccessError('The document references an unavailable asset.');
    assets.push(asset);
  }
  return assets;
}
export async function buildFiles(doc: SiteDocument, userId: string, siteId?: string) {
  const assets = await ownerAssets(doc, userId);
  const files: Record<string, string | Buffer> = siteFiles(doc, {
    formEndpoint: siteId ? `/forms/${siteId}` : undefined,
    canonical: doc.seo.canonical || (siteId ? `${publicOrigin()}/sites/${siteId}` : undefined),
    asset: (url) =>
      url.replace(
        /^\/api\/assets\/([\w-]+)\/file$/,
        (_, id) => `${'__BASE__'}assets/${assets.find((a) => a.id === id)?.filename || 'missing'}`,
      ),
  });
  for (const [name, value] of Object.entries(files))
    if (name.endsWith('.html') && typeof value === 'string') {
      const depth = name.split('/').length - 1;
      files[name] = value.replaceAll('__BASE__', depth ? '../'.repeat(depth) : './');
    }
  for (const a of assets)
    files[`assets/${a.filename}`] = await readFile(path.join(uploads, a.filename));
  for (const size of [180, 192, 512])
    files[size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`] = await sharp(
      Buffer.from(siteIconFor(doc)),
    )
      .resize(size, size)
      .png()
      .toBuffer();
  files['sw.js'] = portfolioWorker(
    doc,
    Object.keys(files).filter((name) => name !== 'sw.js'),
  );
  const checksums = Object.entries(files)
    .map(([name, value]) => `${createHash('sha256').update(value).digest('hex')}  ${name}`)
    .join('\n');
  files['SHA256SUMS'] = checksums;
  files['README.txt'] =
    `Exported from Persona. Serve this directory with any static HTTP server. Clean URL routes use directory index.html files.\n${siteId ? 'Contact forms use the instance form endpoint.' : 'No external backend is required for rendering. Contact forms need an email configured in the document; otherwise they show a visible unconfigured notice.'}\nNo analytics tracker is included.\n`;
  return files;
}
export async function staticArchive(doc: SiteDocument, userId: string) {
  const zip = new JSZip();
  for (const [name, value] of Object.entries(await buildFiles(doc, userId))) zip.file(name, value);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
export async function processDeployment(job: {
  id: string;
  site_id: string;
  version: number;
  document: string;
  user_id: string;
}) {
  const tmp = path.join(artifacts, `${job.id}.tmp`),
    final = path.join(artifacts, job.id);
  try {
    await mkdir(tmp, { recursive: true });
    const doc = parseDocument(JSON.parse(job.document));
    const files = await buildFiles(doc, job.user_id, job.site_id);
    for (const [name, value] of Object.entries(files)) {
      const dest = path.join(tmp, name);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, value);
    }
    await rename(tmp, final);
    await run("UPDATE deployments SET status='ready',log=?,completed_at=? WHERE id=?", [
      'Validated document, prepared assets, generated static pages, checksums and PWA.',
      new Date().toISOString(),
      job.id,
    ]);
    // Never let a superseded slow job replace a newer publication.
    await run(
      'UPDATE websites SET deployment_id=?,published_version=? WHERE id=? AND archived=0 AND (published_version IS NULL OR published_version<=?)',
      [job.id, job.version, job.site_id, job.version],
    );
  } catch (error) {
    await rm(tmp, { recursive: true, force: true });
    await run("UPDATE deployments SET status='failed',log=?,completed_at=? WHERE id=?", [
      (error as Error).message.slice(0, 1000),
      new Date().toISOString(),
      job.id,
    ]);
  }
}
let ticking = false;
export async function tick() {
  if (ticking) return;
  ticking = true;
  try {
    const jobs = await query<{
      id: string;
      site_id: string;
      version: number;
      document: string;
      user_id: string;
    }>(
      "SELECT d.*,w.user_id FROM deployments d JOIN websites w ON w.id=d.site_id WHERE d.status='queued' ORDER BY d.created_at LIMIT 1",
    );
    for (const job of jobs) {
      const claimed = await query<{ id: string }>(
        "UPDATE deployments SET status='building' WHERE id=? AND status='queued' RETURNING id",
        [job.id],
      );
      if (claimed.length) await processDeployment(job);
    }
  } finally {
    ticking = false;
  }
}
export async function recoverJobs() {
  // Only a single worker process is supported. Resume jobs after a process crash.
  await run("UPDATE deployments SET status='queued' WHERE status='building'");
}
