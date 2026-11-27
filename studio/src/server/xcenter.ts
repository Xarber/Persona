// SPDX-License-Identifier: AGPL-3.0-only
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { Express, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { createXCenterOIDC, type LoginTransaction, type Tokens } from '@xcenter-id/server';
import { createUserClient, XCenterError } from '@xcenter-id/client';
import { z } from 'zod';
import { auth, newSession, tokenHash, type AuthRequest } from './auth';
import { query, run } from './db';
import { ApiError, ownSite, type SiteRow } from './app';
import { parseDocument } from '../shared/schema';
import { staticArchive } from './publisher';

const cookieName = 'persona_xcenter_flow';
const callbackPath = '/api/account/callback';
const settings = z.object({
  appearance: z.enum(['light', 'dark', 'system']),
  autoUpdate: z.boolean(),
});
const revision = z.int().nonnegative();
const timeout = () => ({ signal: AbortSignal.timeout(20_000) });
const issuer = 'https://id.xcenter.it';
const recentSignIn = () => new Date(Date.now() - 15 * 60_000).toISOString();

type Grant = { accessToken: string; expiresAt: number; scopes: string[] };
type Flow = { login: LoginTransaction; link?: { sessionId: string; userId: string } };
type Link = { subject: string; grant: string; display_name: string; user_id: string };

function cookie(req: Request) {
  return req.headers.cookie?.match(/(?:^|;\s*)persona_xcenter_flow=([a-f0-9]{64})(?:;|$)/)?.[1];
}

export function grantFromTokens(tokens: Tokens): Grant {
  const seconds = tokens.expires_in;
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0)
    throw new Error('The account provider did not return a valid session expiry.');
  return {
    accessToken: tokens.access_token,
    expiresAt: Date.now() + seconds * 1000,
    scopes: tokens.scope?.split(/\s+/).filter(Boolean) ?? [],
  };
}

export function installXCenter(
  app: Express,
  projectArchive: (site: SiteRow, userId: string) => Promise<Buffer>,
) {
  const clientId = process.env.XCENTER_CLIENT_ID;
  const clientSecret = process.env.XCENTER_CLIENT_SECRET;
  const callback = process.env.XCENTER_REDIRECT_URI;
  const key = Buffer.from(process.env.PERSONA_XCENTER_STORAGE_KEY || '', 'base64');
  const origin = process.env.APP_ORIGIN;
  const enabled = Boolean(
    clientId &&
    clientSecret &&
    key.length === 32 &&
    origin?.startsWith('https://') &&
    callback === new URL(callbackPath, origin).href,
  );
  const flowLimits = rateLimit({ windowMs: 15 * 60_000, limit: 25 });
  const flowCookie = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: callbackPath,
  };

  function seal(value: Grant, owner: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(Buffer.from(owner));
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(value), 'utf8'),
      cipher.final(),
    ]);
    return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
  }
  function unseal(value: string, owner: string): Grant {
    const data = Buffer.from(value, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', key, data.subarray(0, 12));
    decipher.setAAD(Buffer.from(owner));
    decipher.setAuthTag(data.subarray(12, 28));
    return JSON.parse(
      Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString(),
    );
  }
  const oidc = () =>
    createXCenterOIDC({
      file: false,
      clientId,
      clientSecret,
      redirectUri: callback,
      scopes: ['openid', 'profile', 'app_data', 'files_write'],
    });

  async function link(userId: string) {
    return (await query<Link>('SELECT * FROM xcenter_links WHERE user_id=?', [userId]))[0];
  }
  async function userClient(userId: string, scope: string) {
    const connected = await link(userId);
    if (!connected) throw new ApiError(409, 'Connect X-Center ID in Settings first.');
    const grant = unseal(connected.grant, userId);
    if (grant.expiresAt <= Date.now())
      throw new ApiError(401, 'Reconnect X-Center ID in Settings to renew access.');
    if (!grant.scopes.includes(scope))
      throw new ApiError(403, 'Reconnect X-Center ID and allow the requested access.');
    return createUserClient({ clientId: clientId!, getAccessToken: () => grant.accessToken });
  }

  app.get('/api/xcenter/config', (_req, res) =>
    res.json({ enabled, clientId: enabled ? clientId : null }),
  );
  if (!enabled) return;

  app.get('/api/xcenter/account', auth, async (req, res) => {
    const current = await link((req as Request & { userId: string }).userId);
    res.json({ name: current?.display_name || null });
  });
  async function start(res: Response, link?: Flow['link']) {
    const handle = randomBytes(32).toString('hex');
    const { url, transaction } = await (await oidc()).begin();
    const flow: Flow = { login: transaction, link };
    const stamp = new Date().toISOString();
    await run('DELETE FROM xcenter_flows WHERE expires_at<=?', [stamp]);
    await run('INSERT INTO xcenter_flows(id,payload,expires_at) VALUES(?,?,?)', [
      tokenHash(handle),
      JSON.stringify(flow),
      new Date(transaction.expiresAt).toISOString(),
    ]);
    res.cookie(cookieName, handle, { ...flowCookie, maxAge: 10 * 60_000 });
    res.json({ url: url.href });
  }
  async function requireRecentSignIn(req: AuthRequest) {
    const [session] = await query(
      'SELECT id FROM sessions WHERE id=? AND user_id=? AND created_at>=?',
      [req.sessionId, req.userId, recentSignIn()],
    );
    if (!session)
      throw new ApiError(
        403,
        'Sign in to Persona again before changing your X-Center ID connection.',
      );
  }
  app.post('/api/xcenter/link', flowLimits, auth, async (req: AuthRequest, res) => {
    await requireRecentSignIn(req);
    await start(res, { userId: req.userId!, sessionId: req.sessionId! });
  });
  app.post('/api/xcenter/sign-in', flowLimits, (_req, res) => start(res));
  app.get(callbackPath, flowLimits, async (req, res) => {
    res.set('Referrer-Policy', 'no-referrer');
    res.clearCookie(cookieName, flowCookie);
    try {
      const handle = cookie(req);
      if (!handle) throw new Error('Missing sign-in transaction.');
      const [row] = await query<{ payload: string }>(
        'DELETE FROM xcenter_flows WHERE id=? AND expires_at>? RETURNING payload',
        [tokenHash(handle), new Date().toISOString()],
      );
      if (!row) throw new Error('Expired sign-in transaction.');
      const flow: Flow = JSON.parse(row.payload);
      const callbackURL = new URL(callback!);
      callbackURL.search = new URL(req.originalUrl, origin).search;
      const { identity, tokens } = await (await oidc()).complete(callbackURL, flow.login);
      const grant = grantFromTokens(tokens);
      const name = (identity.name || identity.preferred_username || 'X-Center ID').slice(0, 100);
      if (flow.link) {
        const [saved] = await query<{ subject: string }>(
          `INSERT INTO xcenter_links (user_id,issuer,subject,display_name,grant)
           SELECT user_id,?,?,?,? FROM sessions WHERE id=? AND user_id=? AND expires_at>?
           ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name,grant=excluded.grant
           WHERE xcenter_links.issuer=excluded.issuer AND xcenter_links.subject=excluded.subject
           RETURNING subject`,
          [
            issuer,
            identity.sub,
            name,
            seal(grant, flow.link.userId),
            flow.link.sessionId,
            flow.link.userId,
            new Date().toISOString(),
          ],
        );
        if (!saved) throw new Error('Account link did not complete.');
      } else {
        const [linked] = await query<Pick<Link, 'user_id'>>(
          'SELECT user_id FROM xcenter_links WHERE issuer=? AND subject=?',
          [issuer, identity.sub],
        );
        if (!linked) throw new Error('Sign in to Persona and link this account first.');
        await run(
          'UPDATE xcenter_links SET display_name=?,grant=? WHERE user_id=? AND issuer=? AND subject=?',
          [name, seal(grant, linked.user_id), linked.user_id, issuer, identity.sub],
        );
        await newSession(linked.user_id, req, res, grant.expiresAt - Date.now());
      }
      res.redirect(303, '/?xcenter=connected');
    } catch {
      res.redirect(303, '/?xcenter=failed');
    }
  });
  app.delete('/api/xcenter/account', auth, async (req: AuthRequest, res) => {
    await requireRecentSignIn(req);
    await run('DELETE FROM xcenter_links WHERE user_id=?', [
      (req as Request & { userId: string }).userId,
    ]);
    res.json({ ok: true });
  });

  const owner = (req: Request) => (req as Request & { userId: string }).userId;
  app.get('/api/xcenter/settings', auth, async (req, res) => {
    const user = await userClient(owner(req), 'app_data');
    try {
      const record = await user.records.get('settings', 'studio', timeout());
      res.json({ revision: record.revision, settings: settings.parse(record.data) });
    } catch (error) {
      if (error instanceof XCenterError && error.status === 404)
        res.json({ revision: 0, settings: null });
      else throw error;
    }
  });
  app.put('/api/xcenter/settings', auth, async (req, res) => {
    const input = z.object({ revision, settings }).parse(req.body);
    const user = await userClient(owner(req), 'app_data');
    res.json(
      await user.records.put(
        'settings',
        'studio',
        { public: false, data: input.settings },
        { ...timeout(), revision: input.revision },
      ),
    );
  });
  app.get('/api/xcenter/portfolios', auth, async (req, res) => {
    const cursor = z.string().max(500).optional().parse(req.query.cursor);
    const user = await userClient(owner(req), 'app_data');
    const page = await user.records.list('portfolios', { ...timeout(), cursor });
    res.json({
      portfolios: page.records.flatMap((record) => {
        const id = z.uuid().safeParse(record.id);
        const metadata = z.object({ name: z.string().min(1).max(120) }).safeParse(record.data);
        return id.success && metadata.success ? [{ id: id.data, name: metadata.data.name }] : [];
      }),
      nextCursor: page.nextCursor,
    });
  });
  app.get('/api/xcenter/portfolios/:id', auth, async (req, res) => {
    const id = z.uuid().parse(req.params.id);
    const user = await userClient(owner(req), 'app_data');
    try {
      const record = await user.records.get('portfolios', id, timeout());
      res.json({ revision: record.revision, document: parseDocument(record.data) });
    } catch (error) {
      if (error instanceof XCenterError && error.status === 404)
        res.json({ revision: 0, document: null });
      else throw error;
    }
  });
  app.put('/api/xcenter/portfolios/:id', auth, async (req, res) => {
    const version = z.object({ revision }).parse(req.body).revision;
    const site = await ownSite(owner(req), String(req.params.id));
    const document = parseDocument(JSON.parse(site.document));
    const user = await userClient(owner(req), 'app_data');
    res.json(
      await user.records.put(
        'portfolios',
        site.id,
        { public: false, data: JSON.parse(JSON.stringify(document)) },
        { ...timeout(), revision: version },
      ),
    );
  });
  app.post('/api/xcenter/exports/:id', auth, async (req, res) => {
    const user = await userClient(owner(req), 'files_write');
    const site = await ownSite(owner(req), String(req.params.id));
    const format = z.enum(['static', 'project']).parse(req.body?.format);
    const zip =
      format === 'project'
        ? await projectArchive(site, owner(req))
        : await staticArchive(parseDocument(JSON.parse(site.document)), owner(req));
    const name = `persona-${site.id}-v${site.version}-${format}.zip`;
    const file =
      zip.length <= 2 * 1024 * 1024
        ? await user.files.upload({ name, content: zip.toString('base64') }, timeout())
        : await user.files.uploadChunks(
            { name, size: zip.length },
            (offset, size) => zip.subarray(offset, offset + size).toString('base64'),
            { signal: AbortSignal.timeout(120_000) },
          );
    res.json({ id: file.id });
  });
}
