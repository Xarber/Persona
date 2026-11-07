// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import { z, ZodError } from 'zod';
import { randomBytes, createHash } from 'node:crypto';
import { resolveTxt, resolveCname } from 'node:dns/promises';
import { domainToASCII } from 'node:url';
import path from 'node:path';
import { mkdir, readFile, writeFile, rm, stat } from 'node:fs/promises';
import sharp from 'sharp';
import JSZip from 'jszip';
import { query, run, transaction } from './db';
import { checkUpdates } from './updates';
import { installAuthExtras } from './auth-extras';
import { auth, hashPassword, verifyPassword, newSession, type AuthRequest } from './auth';
import {
  AssetAccessError,
  artifacts,
  uploads,
  ownerAssets,
  staticArchive,
  publicOrigin,
  tick,
} from './publisher';
import { createDocument, templates } from '../shared/templates';
import {
  id,
  parseDocument,
  documentSchema,
  ideasPackage,
  ideaSchema,
  type Website,
} from '../shared/schema';
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const requireThat = (condition: unknown, status: number, message: string) => {
  if (!condition) throw new ApiError(status, message);
};
export type SiteRow = {
  id: string;
  user_id: string;
  name: string;
  document: string;
  version: number;
  published_version: number | null;
  deployment_id: string | null;
  archived: number;
  created_at: string;
  updated_at: string;
};
export function siteResponse(r: SiteRow): Website {
  return {
    id: r.id,
    name: r.name,
    document: JSON.parse(r.document),
    version: r.version,
    publishedVersion: r.published_version,
    deploymentId: r.deployment_id,
    archived: !!r.archived,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
export async function ownSite(userId: string, siteId: string) {
  const [row] = await query<SiteRow>('SELECT * FROM websites WHERE id=? AND user_id=?', [
    siteId,
    userId,
  ]);
  if (!row) throw new ApiError(404, 'Website not found.');
  return row;
}
const endpoint =
  (fn: (req: AuthRequest, res: express.Response) => Promise<unknown>) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 1 },
});
const packageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 40 * 1024 * 1024, files: 1 },
});
const authRate = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
const now = () => new Date().toISOString();
const audit = (userId: string, action: string, resource: string) =>
  run('INSERT INTO audit(id,user_id,action,resource,created_at) VALUES(?,?,?,?,?)', [
    id(),
    userId,
    action,
    resource,
    now(),
  ]);
export function createApp() {
  const app = express();
  if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            ...(process.env.NODE_ENV !== 'production' ? ["'unsafe-eval'"] : []),
          ],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          connectSrc: ["'self'", ...(process.env.NODE_ENV !== 'production' ? ['ws:'] : [])],
          frameSrc: ["'self'", 'blob:'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(express.json({ limit: '4mb' }));
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const origin = req.headers.origin;
      const expected = process.env.APP_ORIGIN || 'http://localhost:3100';
      if (origin !== expected) return res.status(403).json({ error: 'Request origin rejected.' });
    }
    next();
  });
  app.get(
    '/api/health',
    endpoint(async (_req, res) => {
      await query('SELECT version FROM schema_migrations LIMIT 1');
      res.json({
        status: 'ok',
        version: '0.1.0',
        commit: process.env.BUILD_COMMIT || 'development',
        schema: 1,
      });
    }),
  );
  const credentials = z.object({
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    password: z.string().min(12).max(256),
  });
  app.post(
    '/api/auth/register',
    authRate,
    endpoint(async (req, res) => {
      requireThat(process.env.REGISTRATION_OPEN !== 'false', 403, 'Registration is closed.');
      const { email, password } = credentials.parse(req.body);
      const exists = await query('SELECT id FROM users WHERE email=?', [email]);
      requireThat(!exists.length, 409, 'Unable to create account with these details.');
      const userId = id();
      await run('INSERT INTO users(id,email,password,created_at) VALUES(?,?,?,?)', [
        userId,
        email,
        hashPassword(password),
        now(),
      ]);
      await newSession(userId, req, res);
      await audit(userId, 'account.created', userId);
      res.status(201).json({ id: userId, email });
    }),
  );
  app.post(
    '/api/auth/login',
    authRate,
    endpoint(async (req, res) => {
      const { email, password } = credentials.parse(req.body);
      const [user] = await query<{ id: string; password: string }>(
        'SELECT id,password FROM users WHERE email=?',
        [email],
      );
      const valid = verifyPassword(
        password,
        user?.password || hashPassword('unused-placeholder-password'),
      );
      requireThat(user && valid, 401, 'Email or password is incorrect.');
      await newSession(user.id, req, res);
      res.json({ id: user.id, email });
    }),
  );
  installAuthExtras(app);
  app.get(
    '/api/auth/me',
    auth,
    endpoint(async (req, res) => {
      const [user] = await query('SELECT id,email,created_at FROM users WHERE id=?', [req.userId]);
      res.json(user);
    }),
  );
  app.post(
    '/api/auth/logout',
    auth,
    endpoint(async (req, res) => {
      await run('DELETE FROM sessions WHERE id=?', [req.sessionId]);
      res.clearCookie('persona_session', { path: '/' });
      res.json({ ok: true });
    }),
  );
  app.get(
    '/api/auth/sessions',
    auth,
    endpoint(async (req, res) =>
      res.json(
        (
          await query<{ id: string }>(
            'SELECT id,label,created_at,expires_at FROM sessions WHERE user_id=?',
            [req.userId],
          )
        ).map((s) => ({ ...s, current: s.id === req.sessionId })),
      ),
    ),
  );
  app.delete(
    '/api/auth/sessions/:id',
    auth,
    endpoint(async (req, res) => {
      await run('DELETE FROM sessions WHERE id=? AND user_id=?', [req.params.id, req.userId]);
      res.json({ ok: true });
    }),
  );
  app.get('/api/config', (_req, res) =>
    res.json({ publicOrigin: publicOrigin(), emailConfigured: !!process.env.SMTP_URL }),
  );
  app.get('/api/templates', (_req, res) => res.json(templates));
  app.get(
    '/api/websites',
    auth,
    endpoint(async (req, res) =>
      res.json(
        (
          await query<SiteRow>('SELECT * FROM websites WHERE user_id=? ORDER BY updated_at DESC', [
            req.userId,
          ])
        ).map(siteResponse),
      ),
    ),
  );
  app.post(
    '/api/websites',
    auth,
    endpoint(async (req, res) => {
      const input = z
        .object({
          name: z.string().min(1).max(120),
          template: z.enum([
            'minimal',
            'developer',
            'creative',
            'student',
            'professional',
            'editorial',
            'blank',
          ]),
          person: z.string().max(100).optional(),
          document: documentSchema.optional(),
        })
        .parse(req.body);
      requireThat(
        (await query('SELECT id FROM websites WHERE user_id=?', [req.userId])).length < 100,
        400,
        'Maximum 100 websites per account.',
      );
      const doc =
        input.document || createDocument(input.template, input.name, input.person || 'Alex Morgan');
      await ownerAssets(doc, req.userId!);
      const siteId = id(),
        time = now();
      await transaction(async (tx) => {
        await tx.run(
          'INSERT INTO websites(id,user_id,name,document,created_at,updated_at) VALUES(?,?,?,?,?,?)',
          [siteId, req.userId, input.name, JSON.stringify(doc), time, time],
        );
        await tx.run(
          'INSERT INTO revisions(id,site_id,version,document,created_at) VALUES(?,?,1,?,?)',
          [id(), siteId, JSON.stringify(doc), time],
        );
      });
      res.status(201).json(siteResponse(await ownSite(req.userId!, siteId)));
    }),
  );
  app.get(
    '/api/websites/:id',
    auth,
    endpoint(async (req, res) =>
      res.json(siteResponse(await ownSite(req.userId!, String(req.params.id)))),
    ),
  );
  app.patch(
    '/api/websites/:id',
    auth,
    endpoint(async (req, res) => {
      const site = await ownSite(req.userId!, String(req.params.id));
      const input = z
        .object({
          version: z.number().int().positive(),
          document: documentSchema.optional(),
          archived: z.boolean().optional(),
        })
        .parse(req.body);
      requireThat(
        input.version === site.version,
        409,
        'This website changed in another window. Export your recovery draft before loading the server version.',
      );
      const doc = input.document || parseDocument(JSON.parse(site.document));
      await ownerAssets(doc, req.userId!);
      const time = now();
      await transaction(async (tx) => {
        const changed = await tx.query<{ id: string }>(
          'UPDATE websites SET name=?,document=?,version=version+1,archived=?,updated_at=? WHERE id=? AND version=? RETURNING id',
          [
            doc.name,
            JSON.stringify(doc),
            Number(input.archived ?? !!site.archived),
            time,
            site.id,
            input.version,
          ],
        );
        requireThat(changed.length, 409, 'A newer version is already saved.');
        await tx.run(
          'INSERT INTO revisions(id,site_id,version,document,created_at) VALUES(?,?,?,?,?)',
          [id(), site.id, site.version + 1, JSON.stringify(doc), time],
        );
      });
      res.json(siteResponse(await ownSite(req.userId!, site.id)));
    }),
  );
  app.delete(
    '/api/websites/:id',
    auth,
    endpoint(async (req, res) => {
      const site = await ownSite(req.userId!, String(req.params.id));
      requireThat(
        req.body.confirm === site.name,
        400,
        'Type the website name to permanently delete it.',
      );
      await run('DELETE FROM websites WHERE id=?', [site.id]);
      await audit(req.userId!, 'website.deleted', site.id);
      res.json({ ok: true });
    }),
  );
  app.get(
    '/api/websites/:id/revisions',
    auth,
    endpoint(async (req, res) => {
      const site = await ownSite(req.userId!, String(req.params.id));
      res.json(
        await query(
          'SELECT id,version,created_at FROM revisions WHERE site_id=? ORDER BY version DESC LIMIT 100',
          [site.id],
        ),
      );
    }),
  );
  app.get(
    '/api/websites/:id/revisions/:revision',
    auth,
    endpoint(async (req, res) => {
      const site = await ownSite(req.userId!, String(req.params.id));
      const [r] = await query<{ document: string }>(
        'SELECT document FROM revisions WHERE site_id=? AND id=?',
        [site.id, req.params.revision],
      );
      requireThat(r, 404, 'Revision not found.');
      res.json(JSON.parse(r.document));
    }),
  );
  app.post(
    '/api/websites/:id/publish',
    auth,
    endpoint(async (req, res) => {
      const site = await ownSite(req.userId!, String(req.params.id));
      requireThat(!site.archived, 409, 'Restore this website before publishing.');
      requireThat(req.body.version === site.version, 409, 'Save all changes before publishing.');
      parseDocument(JSON.parse(site.document));
      await ownerAssets(JSON.parse(site.document), req.userId!);
      const pending = await query<{ id: string }>(
        "SELECT id FROM deployments WHERE site_id=? AND status IN ('queued','building')",
        [site.id],
      );
      if (pending[0]) return res.status(202).json(pending[0]);
      const deployId = id();
      await run(
        "INSERT INTO deployments(id,site_id,version,document,status,log,created_at) VALUES(?,?,?,?,'queued','Waiting for publishing worker',?)",
        [deployId, site.id, site.version, site.document, now()],
      );
      await audit(req.userId!, 'website.publish', site.id);
      if (process.env.EXTERNAL_WORKER !== 'true') void tick();
      res.status(202).json({ id: deployId });
    }),
  );
  app.post(
    '/api/websites/:id/unpublish',
    auth,
    endpoint(async (req, res) => {
      const site = await ownSite(req.userId!, String(req.params.id));
      await run("UPDATE deployments SET status='cancelled' WHERE site_id=? AND status='queued'", [
        site.id,
      ]);
      requireThat(
        !(
          await query("SELECT id FROM deployments WHERE site_id=? AND status='building'", [site.id])
        ).length,
        409,
        'Wait for the current publication to finish, then unpublish.',
      );
      await run('UPDATE websites SET deployment_id=NULL,published_version=NULL WHERE id=?', [
        site.id,
      ]);
      await audit(req.userId!, 'website.unpublished', site.id);
      res.json({ ok: true });
    }),
  );
  app.get(
    '/api/websites/:id/deployments',
    auth,
    endpoint(async (req, res) => {
      const site = await ownSite(req.userId!, String(req.params.id));
      res.json(
        await query(
          'SELECT id,version,status,log,created_at,completed_at FROM deployments WHERE site_id=? ORDER BY created_at DESC',
          [site.id],
        ),
      );
    }),
  );
  app.post(
    '/api/websites/:id/deployments/:deployment/rollback',
    auth,
    endpoint(async (req, res) => {
      const site = await ownSite(req.userId!, String(req.params.id));
      requireThat(!site.archived, 409, 'Restore this site first.');
      requireThat(
        !(
          await query(
            "SELECT id FROM deployments WHERE site_id=? AND status IN ('queued','building')",
            [site.id],
          )
        ).length,
        409,
        'Wait for the publishing job before rolling back.',
      );
      const [dep] = await query<{ id: string; version: number }>(
        "SELECT id,version FROM deployments WHERE id=? AND site_id=? AND status='ready'",
        [req.params.deployment, site.id],
      );
      requireThat(dep, 404, 'A successful deployment is required.');
      await stat(path.join(artifacts, dep.id, 'index.html'));
      await run('UPDATE websites SET deployment_id=?,published_version=? WHERE id=?', [
        dep.id,
        dep.version,
        site.id,
      ]);
      await audit(req.userId!, 'website.rollback', site.id);
      res.json({ ok: true });
    }),
  );
  app.get(
    '/api/websites/:id/export/static',
    auth,
    endpoint(async (req, res) => {
      const site = await ownSite(req.userId!, String(req.params.id));
      res
        .type('application/zip')
        .attachment('persona-static.zip')
        .send(await staticArchive(JSON.parse(site.document), req.userId!));
    }),
  );
  app.get(
    '/api/websites/:id/export/project',
    auth,
    endpoint(async (req, res) => {
      const site = await ownSite(req.userId!, String(req.params.id));
      const zip = new JSZip(),
        doc = parseDocument(JSON.parse(site.document)),
        assets = await ownerAssets(doc, req.userId!);
      const manifest = [];
      for (const a of assets) {
        const bytes = await readFile(path.join(uploads, a.filename));
        zip.file(`assets/${a.id}`, bytes);
        manifest.push({
          id: a.id,
          mime: a.mime,
          sha256: createHash('sha256').update(bytes).digest('hex'),
        });
      }
      zip.file(
        'persona.json',
        JSON.stringify(
          { format: 'persona-project', schemaVersion: 1, document: doc, assets: manifest },
          null,
          2,
        ),
      );
      res
        .type('application/zip')
        .attachment('persona-project.zip')
        .send(await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
    }),
  );
  app.post(
    '/api/import',
    auth,
    packageUpload.single('file'),
    endpoint(async (req, res) => {
      requireThat(req.file, 400, 'Choose a Persona project package.');
      const zip = await JSZip.loadAsync(req.file!.buffer);
      const entries = Object.values(zip.files);
      requireThat(entries.length <= 200, 400, 'Package has too many files.');
      let total = 0;
      for (const entry of entries) {
        requireThat(
          !entry.name.startsWith('/') &&
            !entry.name.split('/').includes('..') &&
            entry.name === (entry.unsafeOriginalName || entry.name),
          400,
          'Unsafe archive path.',
        );
        const size =
          (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ||
          0;
        total += size;
        requireThat(
          size <= 12 * 1024 * 1024 && total <= 60 * 1024 * 1024,
          400,
          'Expanded package exceeds limits.',
        );
      }
      const raw = await zip.file('persona.json')?.async('string');
      requireThat(raw, 400, 'Missing project manifest.');
      const pkg = z
        .object({
          format: z.literal('persona-project'),
          schemaVersion: z.literal(1),
          document: documentSchema,
          assets: z
            .array(
              z.object({
                id: z.string().uuid(),
                mime: z.string(),
                sha256: z.string().regex(/^[a-f0-9]{64}$/),
              }),
            )
            .max(100),
        })
        .strict()
        .parse(JSON.parse(raw!));
      let json = JSON.stringify(pkg.document);
      for (const a of pkg.assets) {
        const data = await zip.file(`assets/${a.id}`)?.async('nodebuffer');
        requireThat(
          data && createHash('sha256').update(data).digest('hex') === a.sha256,
          400,
          'Asset checksum mismatch.',
        );
        const saved = await saveAsset(data!, `Imported image`, a.mime, req.userId!);
        json = json.replaceAll(`/api/assets/${a.id}/file`, `/api/assets/${saved.id}/file`);
      }
      const doc = parseDocument(JSON.parse(json));
      await ownerAssets(doc, req.userId!);
      const siteId = id(),
        time = now();
      await run(
        'INSERT INTO websites(id,user_id,name,document,created_at,updated_at) VALUES(?,?,?,?,?,?)',
        [siteId, req.userId, doc.name, JSON.stringify(doc), time, time],
      );
      await run('INSERT INTO revisions(id,site_id,version,document,created_at) VALUES(?,?,1,?,?)', [
        id(),
        siteId,
        JSON.stringify(doc),
        time,
      ]);
      res.status(201).json(siteResponse(await ownSite(req.userId!, siteId)));
    }),
  );
  app.get(
    '/api/assets',
    auth,
    endpoint(async (req, res) =>
      res.json(
        await query(
          'SELECT id,name,mime,size,alt,created_at FROM assets WHERE user_id=? ORDER BY created_at DESC',
          [req.userId],
        ),
      ),
    ),
  );
  app.post(
    '/api/assets',
    auth,
    upload.single('file'),
    endpoint(async (req, res) => {
      requireThat(req.file, 400, 'Choose an image or PDF.');
      res
        .status(201)
        .json(
          await saveAsset(
            req.file!.buffer,
            req.file!.originalname,
            req.file!.mimetype,
            req.userId!,
          ),
        );
    }),
  );
  app.get(
    '/api/assets/:id/file',
    auth,
    endpoint(async (req, res) => {
      const [a] = await query<{ filename: string; mime: string }>(
        'SELECT filename,mime FROM assets WHERE id=? AND user_id=?',
        [req.params.id, req.userId],
      );
      requireThat(a, 404, 'Asset not found.');
      res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (a.mime === 'application/pdf') res.attachment('resume.pdf');
      res.type(a.mime).sendFile(path.join(uploads, a.filename), { dotfiles: 'allow' });
    }),
  );
  app.patch(
    '/api/assets/:id',
    auth,
    endpoint(async (req, res) => {
      const v = z
        .object({ name: z.string().min(1).max(200), alt: z.string().max(500) })
        .parse(req.body);
      await run('UPDATE assets SET name=?,alt=? WHERE id=? AND user_id=?', [
        v.name,
        v.alt,
        req.params.id,
        req.userId,
      ]);
      res.json({ ok: true });
    }),
  );
  app.delete(
    '/api/assets/:id',
    auth,
    endpoint(async (req, res) => {
      const assetId = z.uuid().parse(req.params.id),
        reference = `%/api/assets/${assetId}/file%`;
      const refs = await query(
        'SELECT id FROM websites WHERE user_id=? AND document LIKE ? UNION ALL SELECT r.id FROM revisions r JOIN websites w ON r.site_id=w.id WHERE w.user_id=? AND r.document LIKE ? UNION ALL SELECT d.id FROM deployments d JOIN websites w ON d.site_id=w.id WHERE w.user_id=? AND d.document LIKE ? LIMIT 1',
        [req.userId, reference, req.userId, reference, req.userId, reference],
      );
      requireThat(
        !refs.length,
        409,
        'This asset is referenced by a draft, revision or deployment. Keep it available for recovery.',
      );
      await run('DELETE FROM assets WHERE id=? AND user_id=?', [req.params.id, req.userId]);
      res.json({ ok: true });
    }),
  );
  app.get(
    '/api/websites/:id/domains',
    auth,
    endpoint(async (req, res) => {
      const s = await ownSite(req.userId!, String(req.params.id));
      res.json(
        (await query('SELECT * FROM domains WHERE site_id=?', [s.id])).map((d) => ({
          ...d,
          target: process.env.DOMAIN_TARGET || 'Configure DOMAIN_TARGET on the instance',
        })),
      );
    }),
  );
  app.post(
    '/api/websites/:id/domains',
    auth,
    endpoint(async (req, res) => {
      const s = await ownSite(req.userId!, String(req.params.id));
      const input = z.object({ hostname: z.string().min(4).max(253) }).parse(req.body);
      const host = domainToASCII(input.hostname.toLowerCase().replace(/\.$/, ''));
      requireThat(
        /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host),
        400,
        'Enter a valid public hostname.',
      );
      requireThat(
        ![
          new URL(process.env.APP_ORIGIN || 'http://localhost:3100').hostname,
          new URL(publicOrigin()).hostname,
        ].includes(host),
        400,
        'The instance hostname cannot be claimed.',
      );
      requireThat(
        !(await query('SELECT id FROM domains WHERE hostname=?', [host])).length,
        409,
        'Domain already assigned.',
      );
      requireThat(
        (await query('SELECT id FROM domains WHERE site_id=?', [s.id])).length < 10,
        400,
        'Maximum 10 domains per website.',
      );
      const token = `persona-verify=${randomBytes(24).toString('hex')}`;
      await run('INSERT INTO domains(id,site_id,hostname,token,created_at) VALUES(?,?,?,?,?)', [
        id(),
        s.id,
        host,
        token,
        now(),
      ]);
      res.status(201).json({ hostname: host, token });
    }),
  );
  app.post(
    '/api/websites/:id/domains/:domain/verify',
    auth,
    rateLimit({ windowMs: 3600000, limit: 30 }),
    endpoint(async (req, res) => {
      const s = await ownSite(req.userId!, String(req.params.id));
      const [d] = await query<{ id: string; hostname: string; token: string }>(
        'SELECT * FROM domains WHERE id=? AND site_id=?',
        [req.params.domain, s.id],
      );
      requireThat(d, 404, 'Domain not found.');
      let txt: string[][] = [];
      try {
        txt = await resolveTxt(`_persona.${d.hostname}`);
      } catch {}
      const verified = txt.some((parts) => parts.join('') === d.token);
      let routing = false;
      try {
        routing = (await resolveCname(d.hostname)).some(
          (name) => name.replace(/\.$/, '') === process.env.DOMAIN_TARGET,
        );
      } catch {}
      await run('UPDATE domains SET verified_at=?,routing=? WHERE id=?', [
        verified ? now() : null,
        Number(routing),
        d.id,
      ]);
      res.json({
        verified,
        routing,
        tls: 'Managed by Caddy after verified DNS routing. Certificate issuance is not yet measured.',
      });
    }),
  );
  app.delete(
    '/api/websites/:id/domains/:domain',
    auth,
    endpoint(async (req, res) => {
      const s = await ownSite(req.userId!, String(req.params.id));
      await run('DELETE FROM domains WHERE id=? AND site_id=?', [req.params.domain, s.id]);
      res.json({ ok: true });
    }),
  );
  app.get(
    '/api/websites/:id/submissions',
    auth,
    endpoint(async (req, res) => {
      const s = await ownSite(req.userId!, String(req.params.id));
      res.json(
        await query(
          'SELECT * FROM submissions WHERE site_id=? ORDER BY created_at DESC LIMIT 200',
          [s.id],
        ),
      );
    }),
  );
  app.delete(
    '/api/websites/:id/submissions/:submission',
    auth,
    endpoint(async (req, res) => {
      const s = await ownSite(req.userId!, String(req.params.id));
      await run('DELETE FROM submissions WHERE id=? AND site_id=?', [req.params.submission, s.id]);
      res.json({ ok: true });
    }),
  );
  app.get(
    '/api/ideas',
    auth,
    endpoint(async (req, res) =>
      res.json(
        (await query<{ data: string }>('SELECT data FROM ideas WHERE user_id=?', [req.userId])).map(
          (i) => JSON.parse(i.data),
        ),
      ),
    ),
  );
  app.put(
    '/api/ideas',
    auth,
    endpoint(async (req, res) => {
      const pack = ideasPackage.parse(req.body);
      const conflicts = [];
      let added = 0;
      for (const idea of pack.ideas) {
        const existing = await query<{ data: string }>(
          'SELECT data FROM ideas WHERE id=? AND user_id=?',
          [idea.id, req.userId],
        );
        if (existing.length) {
          if (existing[0].data !== JSON.stringify(idea)) conflicts.push(idea.id);
          continue;
        }
        await run('INSERT INTO ideas(id,user_id,data) VALUES(?,?,?)', [
          idea.id,
          req.userId,
          JSON.stringify(idea),
        ]);
        added++;
      }
      res.json({ added, conflicts });
    }),
  );
  app.patch(
    '/api/ideas/:id',
    auth,
    endpoint(async (req, res) => {
      const input = z
        .object({ idea: ideaSchema, baseUpdatedAt: z.iso.datetime() })
        .strict()
        .parse(req.body);
      const idea = input.idea;
      requireThat(idea.id === req.params.id, 400, 'Idea ID mismatch.');
      await transaction(async (tx) => {
        const [row] = await tx.query<{ data: string }>(
          'SELECT data FROM ideas WHERE id=? AND user_id=?',
          [idea.id, req.userId],
        );
        requireThat(row, 404, 'Idea not found.');
        const previous = ideaSchema.parse(JSON.parse(row.data));
        requireThat(
          previous.updatedAt === input.baseUpdatedAt,
          409,
          'This idea changed on another device. Export your local copy before resolving the conflict.',
        );
        const history = previous.history || [];
        if (previous.status !== idea.status)
          history.push({
            at: idea.updatedAt,
            status: idea.status,
            note: `Status changed from ${previous.status}`,
          });
        await tx.run('UPDATE ideas SET data=? WHERE id=? AND user_id=?', [
          JSON.stringify({ ...idea, history: history.slice(-500) }),
          idea.id,
          req.userId,
        ]);
      });
      res.json({ ok: true });
    }),
  );
  app.delete(
    '/api/ideas/:id',
    auth,
    endpoint(async (req, res) => {
      await run('DELETE FROM ideas WHERE id=? AND user_id=?', [req.params.id, req.userId]);
      res.json({ ok: true });
    }),
  );
  app.get(
    '/api/preferences',
    auth,
    endpoint(async (req, res) => {
      const [p] = await query<{ data: string }>('SELECT data FROM preferences WHERE user_id=?', [
        req.userId,
      ]);
      res.json(p ? JSON.parse(p.data) : { analytics: false });
    }),
  );
  app.put(
    '/api/preferences',
    auth,
    endpoint(async (req, res) => {
      const p = z.object({ analytics: z.boolean() }).parse(req.body);
      await run(
        'INSERT INTO preferences(user_id,data) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data',
        [req.userId, JSON.stringify(p)],
      );
      res.json(p);
    }),
  );
  app.get(
    '/api/websites/:id/analytics',
    auth,
    endpoint(async (req, res) => {
      const s = await ownSite(req.userId!, String(req.params.id));
      res.json({
        provenance:
          'Measured server requests; includes bots and repeat visits. No unique visitor estimate.',
        rows: await query(
          'SELECT day,path,views FROM analytics WHERE site_id=? ORDER BY day DESC LIMIT 100',
          [s.id],
        ),
      });
    }),
  );
  app.get(
    '/api/updates',
    auth,
    endpoint(async (_req, res) => res.json(await checkUpdates())),
  );
  app.get(
    '/api/account/export',
    auth,
    endpoint(async (req, res) => {
      const zip = new JSZip();
      const [user] = await query('SELECT id,email,created_at FROM users WHERE id=?', [req.userId]);
      zip.file('account.json', JSON.stringify(user, null, 2));
      zip.file(
        'websites.json',
        JSON.stringify(
          (await query<SiteRow>('SELECT * FROM websites WHERE user_id=?', [req.userId])).map(
            siteResponse,
          ),
          null,
          2,
        ),
      );
      zip.file(
        'ideas.json',
        JSON.stringify(
          (
            await query<{ data: string }>('SELECT data FROM ideas WHERE user_id=?', [req.userId])
          ).map((row) => JSON.parse(row.data)),
          null,
          2,
        ),
      );
      for (const table of ['revisions', 'domains', 'submissions', 'analytics']) {
        const rows = await query(
          `SELECT r.* FROM ${table} r JOIN websites w ON r.site_id=w.id WHERE w.user_id=?`,
          [req.userId],
        );
        zip.file(`${table}.json`, JSON.stringify(rows, null, 2));
      }
      zip.file(
        'deployments.json',
        JSON.stringify(
          await query(
            'SELECT d.id,d.site_id,d.version,d.status,d.log,d.created_at,d.completed_at FROM deployments d JOIN websites w ON d.site_id=w.id WHERE w.user_id=?',
            [req.userId],
          ),
          null,
          2,
        ),
      );
      zip.file(
        'preferences.json',
        JSON.stringify(
          await query('SELECT data FROM preferences WHERE user_id=?', [req.userId]),
          null,
          2,
        ),
      );
      const assets = await query<{
        id: string;
        filename: string;
        original: string;
        name: string;
        mime: string;
        alt: string;
      }>('SELECT id,filename,original,name,mime,alt FROM assets WHERE user_id=?', [req.userId]);
      zip.file(
        'assets.json',
        JSON.stringify(
          assets.map(({ original, ...asset }) => asset),
          null,
          2,
        ),
      );
      for (const asset of assets) {
        zip.file(`assets/${asset.filename}`, await readFile(path.join(uploads, asset.filename)));
        zip.file(`originals/${asset.id}`, await readFile(path.join(uploads, asset.original)));
      }
      res
        .type('application/zip')
        .attachment('persona-account.zip')
        .send(await zip.generateAsync({ type: 'nodebuffer' }));
    }),
  );
  app.delete(
    '/api/account',
    auth,
    endpoint(async (req, res) => {
      const [u] = await query<{ email: string; password: string }>(
        'SELECT email,password FROM users WHERE id=?',
        [req.userId],
      );
      const input = z.object({ email: z.email(), password: z.string().max(256) }).parse(req.body);
      requireThat(
        u && u.email === input.email && verifyPassword(input.password, u.password),
        403,
        'Confirm your email and password.',
      );
      await transaction(async (tx) => {
        await tx.run('DELETE FROM auth_tokens WHERE user_id=?', [req.userId]);
        await tx.run('DELETE FROM users WHERE id=?', [req.userId]);
      });
      res.clearCookie('persona_session', { path: '/' });
      res.json({ ok: true });
    }),
  );
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found.' }));
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) return next(err);
    const status =
      err instanceof ZodError || err instanceof AssetAccessError
        ? 400
        : err instanceof ApiError
          ? err.status
          : err instanceof multer.MulterError
            ? 400
            : 500;
    res.status(status).json({
      error:
        err instanceof ZodError
          ? err.issues
              .slice(0, 3)
              .map((i) => i.message)
              .join('; ')
          : status === 500
            ? 'The operation could not be completed. Please retry.'
            : err.message,
    });
    if (status === 500) console.error('Request failed:', req.path, err.message);
  });
  return app;
}
async function saveAsset(bytes: Buffer, name: string, mime: string, userId: string) {
  const existing = await query<{ size: number }>('SELECT size FROM assets WHERE user_id=?', [
    userId,
  ]);
  requireThat(
    existing.length < 500 &&
      existing.reduce((sum, a) => sum + a.size, 0) + bytes.length < 256 * 1024 * 1024,
    400,
    'Asset library limit reached (500 assets / 256 MB).',
  );
  await mkdir(uploads, { recursive: true });
  const assetId = id();
  let result: Buffer, ext: string, outMime: string;
  if (mime === 'application/pdf') {
    requireThat(bytes.subarray(0, 5).toString() === '%PDF-', 400, 'Invalid PDF.');
    result = bytes;
    ext = 'pdf';
    outMime = 'application/pdf';
  } else {
    requireThat(
      ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'].includes(mime),
      400,
      'Only raster images and PDFs are accepted. SVG, scripts and custom fonts are not accepted.',
    );
    try {
      const image = sharp(bytes, { limitInputPixels: 40000000 });
      const meta = await image.metadata();
      requireThat(
        ['png', 'jpeg', 'webp', 'gif', 'avif', 'heif'].includes(meta.format || ''),
        400,
        'Image format does not match.',
      );
      result = await image
        .rotate()
        .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 88 })
        .toBuffer();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(400, 'Image could not be decoded safely.');
    }
    ext = 'webp';
    outMime = 'image/webp';
  }
  const filename = `${assetId}.${ext}`,
    original = `${assetId}.original`;
  await writeFile(path.join(uploads, filename), result);
  await writeFile(path.join(uploads, original), bytes);
  await run(
    'INSERT INTO assets(id,user_id,name,mime,size,filename,original,alt,created_at) VALUES(?,?,?,?,?,?,?,?,?)',
    [
      assetId,
      userId,
      name.replace(/[^\p{L}\p{N} ._-]/gu, '').slice(0, 200) || 'Asset',
      outMime,
      result.length,
      filename,
      original,
      '',
      now(),
    ],
  );
  return {
    id: assetId,
    name,
    mime: outMime,
    size: result.length,
    url: `/api/assets/${assetId}/file`,
  };
}
export function createPublicApp() {
  const app = express();
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
  app.use(
    helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }),
  );
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: false, limit: '10kb' }));
  app.get(
    '/_tls/allow',
    endpoint(async (req, res) => {
      const host = String(req.query.domain || '').toLowerCase();
      const [d] = await query<{ id: string }>(
        'SELECT d.id FROM domains d JOIN websites w ON w.id=d.site_id WHERE d.hostname=? AND d.verified_at>? AND d.routing=1 AND w.archived=0 AND w.deployment_id IS NOT NULL',
        [host, new Date(Date.now() - 7 * 86400000).toISOString()],
      );
      res.sendStatus(d ? 200 : 403);
    }),
  );
  app.post(
    '/forms/:site',
    rateLimit({ windowMs: 3600000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false }),
    endpoint(async (req, res) => {
      const [site] = await query<SiteRow>(
        'SELECT * FROM websites WHERE id=? AND deployment_id IS NOT NULL AND archived=0',
        [req.params.site],
      );
      requireThat(site, 404, 'Site unavailable.');
      const input = z
        .object({
          name: z.string().min(1).max(100),
          email: z.email().max(254),
          message: z.string().min(1).max(5000),
          website: z.string().max(200).optional(),
        })
        .parse(req.body);
      requireThat(!input.website, 400, 'Unable to accept this submission.');
      const [dep] = await query<{ document: string }>(
        'SELECT document FROM deployments WHERE id=?',
        [site.deployment_id],
      );
      requireThat(dep?.document.includes('"type":"contact"'), 404, 'No published contact form.');
      await run(
        'INSERT INTO submissions(id,site_id,name,email,message,created_at) VALUES(?,?,?,?,?,?)',
        [id(), site.id, input.name, input.email, input.message, now()],
      );
      res.status(201).json({ ok: true });
    }),
  );
  app.use(
    endpoint(async (req, res) => {
      let site: SiteRow | undefined,
        relative = req.path;
      const host = req.hostname.toLowerCase();
      const pathMatch = req.path.match(/^\/sites\/([\w-]+)(\/.*)?$/);
      if (
        host !== new URL(publicOrigin()).hostname &&
        host !== '127.0.0.1' &&
        host !== 'localhost'
      ) {
        const [d] = await query<{ site_id: string }>(
          'SELECT site_id FROM domains WHERE hostname=? AND verified_at>? AND routing=1',
          [host, new Date(Date.now() - 7 * 86400000).toISOString()],
        );
        if (d) [site] = await query<SiteRow>('SELECT * FROM websites WHERE id=?', [d.site_id]);
      } else if (pathMatch) {
        [site] = await query<SiteRow>('SELECT * FROM websites WHERE id=?', [pathMatch[1]]);
        relative = pathMatch[2] || '/';
      }
      requireThat(site?.deployment_id && !site.archived, 404, 'This website is not published.');
      requireThat(req.method === 'GET' || req.method === 'HEAD', 405, 'Method not supported.');
      const decoded = decodeURIComponent(relative);
      requireThat(
        !decoded.split('/').includes('..') && !decoded.includes('\\'),
        400,
        'Invalid path.',
      );
      let filename = decoded.replace(/^\//, '');
      if (!filename || filename.endsWith('/')) filename += 'index.html';
      else if (!path.extname(filename)) {
        res.redirect(308, `${req.path}/`);
        return;
      }
      const root = path.join(artifacts, site!.deployment_id!);
      const target = path.resolve(root, filename);
      requireThat(target.startsWith(root + path.sep), 400, 'Invalid path.');
      try {
        await stat(target);
      } catch {
        throw new ApiError(404, 'Page not found.');
      }
      if (filename.endsWith('.html')) {
        const [pref] = await query<{ data: string }>(
          'SELECT data FROM preferences WHERE user_id=?',
          [site!.user_id],
        );
        if (pref && JSON.parse(pref.data).analytics) {
          const day = new Date().toISOString().slice(0, 10);
          await run(
            'INSERT INTO analytics(site_id,day,path,views) VALUES(?,?,?,1) ON CONFLICT(site_id,day,path) DO UPDATE SET views=analytics.views+1',
            [site!.id, day, filename],
          );
        }
      }
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; media-src 'self' https:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
      );
      res.setHeader('Cache-Control', 'no-cache');
      if (filename === 'sw.js') {
        res.type('application/javascript');
        res.setHeader('Service-Worker-Allowed', pathMatch ? `/sites/${site!.id}/` : '/');
      }
      res.sendFile(target, { dotfiles: 'allow' });
    }),
  );
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) =>
    res
      .status(err instanceof ApiError ? err.status : err instanceof ZodError ? 400 : 500)
      .json({ error: err instanceof ApiError ? err.message : 'Request could not be completed.' }),
  );
  return app;
}
