// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import JSZip from 'jszip';
import { createDocument } from '../src/shared/templates';
import { id } from '../src/shared/schema';
vi.mock('node:dns/promises', () => ({ resolveTxt: vi.fn(), resolveCname: vi.fn() }));
let app: ReturnType<typeof import('../src/server/app').createApp>,
  pub: ReturnType<typeof import('../src/server/app').createPublicApp>,
  alice: ReturnType<typeof request.agent>,
  bob: ReturnType<typeof request.agent>,
  site: any,
  asset: any,
  temp: string,
  db: typeof import('../src/server/db'),
  publisher: typeof import('../src/server/publisher');
const origin = 'http://localhost:3100';
const csrf = { Origin: origin };
beforeAll(async () => {
  temp = await mkdtemp(path.join(os.tmpdir(), 'persona-tests-'));
  process.env.DATA_DIR = temp;
  process.env.EXTERNAL_WORKER = 'true';
  process.env.APP_ORIGIN = origin;
  process.env.PUBLIC_ORIGIN = 'http://localhost:3101';
  process.env.DOMAIN_TARGET = 'sites.example.test';
  db = await import('../src/server/db');
  await db.migrate();
  const apps = await import('../src/server/app');
  app = apps.createApp();
  pub = apps.createPublicApp();
  publisher = await import('../src/server/publisher');
  alice = request.agent(app);
  bob = request.agent(app);
  await alice
    .post('/api/auth/register')
    .set(csrf)
    .send({ email: 'alice@example.test', password: 'test-only-password-A1' })
    .expect(201);
  await bob
    .post('/api/auth/register')
    .set(csrf)
    .send({ email: 'bob@example.test', password: 'test-only-password-B2' })
    .expect(201);
});
afterAll(async () => {
  await db.closeDb();
  await rm(temp, { recursive: true, force: true });
});
describe('authenticated workspace integration', () => {
  it('denies unauthenticated drafts, forged origins and short passwords', async () => {
    await request(app).get('/api/websites').expect(401);
    await alice.post('/api/websites').set('Origin', 'https://evil.example').send({}).expect(403);
    await request(app)
      .post('/api/auth/register')
      .set(csrf)
      .send({ email: 'x@example.test', password: 'short' })
      .expect(400);
  });
  it('creates a website with revision 1 and preserves ownership', async () => {
    site = (
      await alice
        .post('/api/websites')
        .set(csrf)
        .send({ name: 'Alice portfolio', template: 'minimal' })
        .expect(201)
    ).body;
    expect(site.version).toBe(1);
    await bob.get(`/api/websites/${site.id}`).expect(404);
    const r = await alice.get(`/api/websites/${site.id}/revisions`).expect(200);
    expect(r.body).toHaveLength(1);
  });
  it('saves drafts with optimistic concurrency and rejects lost updates', async () => {
    site.document.pages[0].nodes[1].props.text = 'Edited hero';
    const saved = await alice
      .patch(`/api/websites/${site.id}`)
      .set(csrf)
      .send({ version: 1, document: site.document })
      .expect(200);
    site = saved.body;
    expect(site.version).toBe(2);
    await alice
      .patch(`/api/websites/${site.id}`)
      .set(csrf)
      .send({ version: 1, document: site.document })
      .expect(409);
    expect((await alice.get(`/api/websites/${site.id}/revisions`)).body).toHaveLength(2);
  });
  it('makes one concurrent draft write win without losing its revision', async () => {
    const results = await Promise.all([
      alice
        .patch(`/api/websites/${site.id}`)
        .set(csrf)
        .send({ version: site.version, document: { ...site.document, name: 'Concurrent A' } }),
      alice
        .patch(`/api/websites/${site.id}`)
        .set(csrf)
        .send({ version: site.version, document: { ...site.document, name: 'Concurrent B' } }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    site = (await alice.get(`/api/websites/${site.id}`)).body;
    expect((await alice.get(`/api/websites/${site.id}/revisions`)).body.length).toBe(site.version);
  });
  it('rolls back a failed transaction', async () => {
    await expect(
      db.transaction(async (tx) => {
        await tx.run("UPDATE websites SET name='BROKEN' WHERE id=?", [site.id]);
        throw Error('fail');
      }),
    ).rejects.toThrow('fail');
    expect((await alice.get(`/api/websites/${site.id}`)).body.name).not.toBe('BROKEN');
  });
  it('validates and processes image uploads, and rejects SVG', async () => {
    const bytes = await sharp({
      create: { width: 80, height: 60, channels: 3, background: '#447755' },
    })
      .png()
      .toBuffer();
    asset = (
      await alice
        .post('/api/assets')
        .set(csrf)
        .attach('file', bytes, { filename: 'cover.png', contentType: 'image/png' })
        .expect(201)
    ).body;
    expect(asset.mime).toBe('image/webp');
    await alice.get(asset.url).expect(200);
    await bob.get(asset.url).expect(404);
    await request(app).get(asset.url).expect(401);
    await alice
      .post('/api/assets')
      .set(csrf)
      .attach('file', Buffer.from('<svg><script>alert(1)</script></svg>'), {
        filename: 'bad.svg',
        contentType: 'image/svg+xml',
      })
      .expect(400);
    await alice
      .post('/api/assets')
      .set(csrf)
      .attach('file', Buffer.from('not a real png'), {
        filename: 'fake.png',
        contentType: 'image/png',
      })
      .expect(400);
  });
  it('prevents cross-user asset references in documents', async () => {
    const doc = createDocument();
    doc.pages[0].nodes.push({
      id: id(),
      type: 'image',
      props: { src: asset.url, alt: 'A cover' },
      style: {},
      responsive: {},
      children: [],
    });
    await bob
      .post('/api/websites')
      .set(csrf)
      .send({ name: 'Bad reference', template: 'blank', document: doc })
      .expect(400);
    site.document = doc;
    site = (
      await alice
        .patch(`/api/websites/${site.id}`)
        .set(csrf)
        .send({ version: site.version, document: doc })
        .expect(200)
    ).body;
    await alice.delete(`/api/assets/${asset.id}`).set(csrf).expect(409);
  });
  it('queues and publishes an immutable website with assets and PWA', async () => {
    await alice
      .post(`/api/websites/${site.id}/publish`)
      .set(csrf)
      .send({ version: site.version - 1 })
      .expect(409);
    await alice
      .post(`/api/websites/${site.id}/publish`)
      .set(csrf)
      .send({ version: site.version })
      .expect(202);
    await publisher.tick();
    site = (await alice.get(`/api/websites/${site.id}`)).body;
    expect(site.deploymentId).toBeTruthy();
    const r = await request(pub).get(`/sites/${site.id}/`).expect(200);
    expect(r.text).toContain('Good work.');
    expect(r.text).not.toContain('data-edit=');
    await request(pub).get(`/sites/${site.id}/assets/${asset.id}.webp`).expect(200);
    await request(pub).get(`/sites/${site.id}/manifest.webmanifest`).expect(200);
  });
  it('rejects unauthorized publishing and keeps unpublished changes private', async () => {
    await bob
      .post(`/api/websites/${site.id}/publish`)
      .set(csrf)
      .send({ version: site.version })
      .expect(404);
    site.document.pages[0].nodes[1].props.text = 'PRIVATE DRAFT CONTENT';
    site = (
      await alice
        .patch(`/api/websites/${site.id}`)
        .set(csrf)
        .send({ version: site.version, document: site.document })
    ).body;
    expect((await request(pub).get(`/sites/${site.id}/`)).text).not.toContain(
      'PRIVATE DRAFT CONTENT',
    );
  });
  it('retains the working deployment when an asset build fails', async () => {
    const old = site.deploymentId;
    const dep = id();
    await db.run(
      "INSERT INTO deployments(id,site_id,version,document,status,log,created_at) VALUES(?,?,?,?,'queued','test',?)",
      [
        dep,
        site.id,
        site.version,
        JSON.stringify({
          ...site.document,
          theme: { ...site.document.theme, background: 'unsafe' },
        }),
        new Date().toISOString(),
      ],
    );
    await publisher.tick();
    expect(
      (await db.query<any>('SELECT status FROM deployments WHERE id=?', [dep]))[0].status,
    ).toBe('failed');
    expect((await alice.get(`/api/websites/${site.id}`)).body.deploymentId).toBe(old);
    await request(pub).get(`/sites/${site.id}/`).expect(200);
  });
  it('republishes and rolls back without replacing the draft', async () => {
    const old = site.deploymentId;
    await alice.post(`/api/websites/${site.id}/publish`).set(csrf).send({ version: site.version });
    await publisher.tick();
    expect((await request(pub).get(`/sites/${site.id}/`)).text).toContain('PRIVATE DRAFT CONTENT');
    await alice
      .post(`/api/websites/${site.id}/deployments/${old}/rollback`)
      .set(csrf)
      .send({})
      .expect(200);
    expect((await request(pub).get(`/sites/${site.id}/`)).text).not.toContain(
      'PRIVATE DRAFT CONTENT',
    );
    expect(
      (await alice.get(`/api/websites/${site.id}`)).body.document.pages[0].nodes[1].props.text,
    ).toBe('PRIVATE DRAFT CONTENT');
  });
  it('exports static packages independent of private asset URLs', async () => {
    const r = await alice
      .get(`/api/websites/${site.id}/export/static`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);
    const zip = await JSZip.loadAsync(r.body);
    const html = await zip.file('index.html')!.async('string');
    expect(html).not.toContain('/api/assets/');
    expect(html).toContain(`./assets/${asset.id}.webp`);
    expect(zip.file('SHA256SUMS')).toBeTruthy();
    expect(zip.file('icon-512.png')).toBeTruthy();
    expect(zip.file('projects/common-ground/index.html')).toBeTruthy();
  });
  it('round-trips editable packages and rejects invalid project data', async () => {
    const r = await alice
      .get(`/api/websites/${site.id}/export/project`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);
    const imported = await bob
      .post('/api/import')
      .set(csrf)
      .attach('file', r.body, 'project.zip')
      .expect(201);
    expect(imported.body.document.pages[0].nodes[1].props.text).toBe('PRIVATE DRAFT CONTENT');
    const zip = new JSZip();
    zip.file(
      'persona.json',
      JSON.stringify({
        format: 'persona-project',
        schemaVersion: 1,
        document: { ...site.document, schemaVersion: 88 },
        assets: [],
      }),
    );
    await alice
      .post('/api/import')
      .set(csrf)
      .attach('file', await zip.generateAsync({ type: 'nodebuffer' }), 'bad.zip')
      .expect(400);
  });
  it('requires DNS TXT ownership and routing before assigning custom domains', async () => {
    await alice
      .post(`/api/websites/${site.id}/domains`)
      .set(csrf)
      .send({ hostname: 'work.example.test' })
      .expect(201);
    const d = (await alice.get(`/api/websites/${site.id}/domains`)).body[0];
    await bob
      .post(`/api/websites/${site.id}/domains/${d.id}/verify`)
      .set(csrf)
      .send({})
      .expect(404);
    const dns = await import('node:dns/promises');
    vi.mocked(dns.resolveTxt).mockResolvedValue([]);
    vi.mocked(dns.resolveCname).mockResolvedValue(['sites.example.test']);
    const first = await alice
      .post(`/api/websites/${site.id}/domains/${d.id}/verify`)
      .set(csrf)
      .send({})
      .expect(200);
    expect(first.body.verified).toBe(false);
    await request(pub).get('/_tls/allow?domain=work.example.test').expect(403);
    vi.mocked(dns.resolveTxt).mockResolvedValue([[d.token]]);
    await alice
      .post(`/api/websites/${site.id}/domains/${d.id}/verify`)
      .set(csrf)
      .send({})
      .expect(200);
    await request(pub).get('/_tls/allow?domain=work.example.test').expect(200);
    await request(pub).get('/').set('Host', 'work.example.test').expect(200);
    await db.run('UPDATE domains SET verified_at=? WHERE id=?', [
      new Date(Date.now() - 8 * 86400000).toISOString(),
      d.id,
    ]);
    await request(pub).get('/_tls/allow?domain=work.example.test').expect(403);
    await alice.delete(`/api/websites/${site.id}/domains/${d.id}`).set(csrf).expect(200);
    await request(pub).get('/').set('Host', 'work.example.test').expect(404);
  });
  it('accepts valid public contact messages and isolates the inbox', async () => {
    await request(pub)
      .post(`/forms/${site.id}`)
      .send({ name: 'Visitor', email: 'hello@example.test', message: 'A test note', website: '' })
      .expect(201);
    await request(pub)
      .post(`/forms/${site.id}`)
      .send({ name: 'Bot', email: 'bot@example.test', message: 'Spam', website: 'spam' })
      .expect(400);
    await request(pub)
      .post(`/forms/${site.id}`)
      .send({ name: 'Visitor', email: 'wrong', message: 'Hello' })
      .expect(400);
    expect((await alice.get(`/api/websites/${site.id}/submissions`)).body).toHaveLength(1);
    await bob.get(`/api/websites/${site.id}/submissions`).expect(404);
  });
  it('keeps ideas persistent and merges by stable ID without silent overwrites', async () => {
    const idea = {
      id: id(),
      title: 'A better gallery',
      description: 'Add a new layout',
      category: 'Improvement',
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
    expect((await alice.put('/api/ideas').set(csrf).send(pack)).body.added).toBe(1);
    const conflict = await alice
      .put('/api/ideas')
      .set(csrf)
      .send({ ...pack, ideas: [{ ...idea, title: 'Different' }] });
    expect(conflict.body.conflicts).toEqual([idea.id]);
    expect((await alice.get('/api/ideas')).body[0].title).toBe(idea.title);
    expect((await bob.get('/api/ideas')).body).toHaveLength(0);
  });
  it('preserves idea status history and rejects stale or cross-user updates', async () => {
    const original = (await alice.get('/api/ideas')).body[0];
    const next = {
      ...original,
      status: 'Approved',
      updatedAt: new Date(Date.now() + 1000).toISOString(),
    };
    await alice
      .patch('/api/ideas/' + original.id)
      .set(csrf)
      .send({ idea: next, baseUpdatedAt: original.updatedAt })
      .expect(200);
    const saved = (await alice.get('/api/ideas')).body[0];
    expect(saved.history.at(-1).status).toBe('Approved');
    await alice
      .patch('/api/ideas/' + original.id)
      .set(csrf)
      .send({ idea: { ...next, status: 'Deferred' }, baseUpdatedAt: original.updatedAt })
      .expect(409);
    await bob
      .patch('/api/ideas/' + original.id)
      .set(csrf)
      .send({ idea: next, baseUpdatedAt: next.updatedAt })
      .expect(404);
  });
  it('counts page views only after explicit analytics opt-in', async () => {
    expect((await alice.get(`/api/websites/${site.id}/analytics`)).body.rows).toHaveLength(0);
    await alice.put('/api/preferences').set(csrf).send({ analytics: true }).expect(200);
    await request(pub).get(`/sites/${site.id}/`).expect(200);
    expect((await alice.get(`/api/websites/${site.id}/analytics`)).body.rows[0].views).toBe(1);
  });
  it('supports sessions, safe auth configuration errors and rejects forged passkeys', async () => {
    const sessions = (await alice.get('/api/auth/sessions')).body;
    expect(sessions[0].current).toBe(true);
    await alice.post('/api/auth/verification/request').set(csrf).send({}).expect(503);
    await request(app)
      .post('/api/auth/password/request')
      .set(csrf)
      .send({ email: 'alice@example.test' })
      .expect(503);
    await request(app)
      .post('/api/auth/passkeys/login/verify')
      .set(csrf)
      .send({ challengeId: 'fake', response: { id: 'fake' } })
      .expect(400);
    const options = await alice
      .post('/api/auth/passkeys/register/options')
      .set(csrf)
      .send({})
      .expect(200);
    expect(options.body.options.rp.id).toBe('localhost');
  });
  it('unpublishes immediately and permits republishing', async () => {
    await alice.post(`/api/websites/${site.id}/unpublish`).set(csrf).send({}).expect(200);
    await request(pub).get(`/sites/${site.id}/`).expect(404);
    await alice
      .post(`/api/websites/${site.id}/publish`)
      .set(csrf)
      .send({ version: site.version })
      .expect(202);
    await publisher.tick();
    await request(pub).get(`/sites/${site.id}/`).expect(200);
  });
  it('exports owned personal content and originals without authentication secrets', async () => {
    const response = await alice
      .get('/api/account/export')
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);
    const archive = await JSZip.loadAsync(response.body);
    expect(await archive.file('submissions.json')!.async('string')).toContain('A test note');
    expect(archive.file(`originals/${asset.id}`)).toBeTruthy();
    expect(await archive.file('account.json')!.async('string')).not.toContain('password');
    expect(archive.file('sessions.json')).toBeNull();
  });
  it('deletes accounts only after password confirmation and revokes public access', async () => {
    await alice
      .delete('/api/account')
      .set(csrf)
      .send({ email: 'alice@example.test', password: 'wrong' })
      .expect(403);
    await alice
      .delete('/api/account')
      .set(csrf)
      .send({ email: 'alice@example.test', password: 'test-only-password-A1' })
      .expect(200);
    await alice.get('/api/websites').expect(401);
    await request(pub).get(`/sites/${site.id}/`).expect(404);
    expect(
      (await db.query("SELECT * FROM auth_tokens WHERE purpose='webauthn-register'")).length,
    ).toBe(0);
  });
});
