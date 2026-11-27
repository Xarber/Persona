// SPDX-License-Identifier: AGPL-3.0-only
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import request from 'supertest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import JSZip from 'jszip';

const provider = vi.hoisted(() => ({
  complete: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  upload: vi.fn(),
}));
vi.mock('@xcenter-id/server', () => ({
  createXCenterOIDC: async () => ({
    begin: async () => ({
      url: new URL('https://id.xcenter.it/auth'),
      transaction: { state: 'test-state', expiresAt: Date.now() + 60_000 },
    }),
    complete: provider.complete,
  }),
}));
vi.mock('@xcenter-id/client', async (original) => ({
  ...(await original<typeof import('@xcenter-id/client')>()),
  createUserClient: () => ({
    records: { get: provider.get, put: provider.put },
    files: { upload: provider.upload },
  }),
}));

const origin = 'https://persona.example.test';
const callback = '/api/account/callback';
const csrf = { Origin: origin };
let temp: string;
let app: ReturnType<typeof import('../src/server/app').createApp>;
let db: typeof import('../src/server/db');

beforeAll(async () => {
  temp = await mkdtemp(path.join(tmpdir(), 'persona-xcenter-test-'));
  vi.stubEnv('DATA_DIR', temp);
  vi.stubEnv('APP_ORIGIN', origin);
  vi.stubEnv('PUBLIC_ORIGIN', 'https://sites.example.test');
  vi.stubEnv('XCENTER_CLIENT_ID', 'test-client');
  vi.stubEnv('XCENTER_CLIENT_SECRET', 'test-only-secret');
  vi.stubEnv('XCENTER_REDIRECT_URI', origin + callback);
  vi.stubEnv('PERSONA_XCENTER_STORAGE_KEY', randomBytes(32).toString('base64'));
  db = await import('../src/server/db');
  await db.migrate();
  app = (await import('../src/server/app')).createApp();
});
afterAll(async () => {
  await db.closeDb();
  vi.unstubAllEnvs();
  await rm(temp, { recursive: true, force: true });
});

const cookie = (response: request.Response) =>
  String(response.headers['set-cookie'][0]).split(';')[0];
async function register(name: string) {
  return cookie(
    await request(app)
      .post('/api/auth/register')
      .set(csrf)
      .send({ email: `${name}@example.test`, password: 'isolated-test-password' })
      .expect(201),
  );
}

it('binds the callback to the initiating account, blocks replay and signs in an explicitly linked subject', async () => {
  const owner = await register('persona-owner');
  const other = await register('persona-other');
  provider.complete.mockResolvedValue({
    identity: { sub: 'test-subject', name: 'Studio owner' },
    tokens: {
      access_token: 'fixture-provider-token',
      expires_in: 900,
      scope: 'openid app_data files_write',
    },
  });
  await request(app).post('/api/xcenter/link').set(csrf).expect(401);
  await request(app).post('/api/xcenter/link').set('Cookie', owner).expect(403);
  const flow = cookie(
    await request(app).post('/api/xcenter/link').set(csrf).set('Cookie', owner).expect(200),
  );

  await request(app)
    .get(callback)
    .set('Cookie', other)
    .expect(303)
    .expect('Location', '/?xcenter=failed');
  expect(provider.complete).not.toHaveBeenCalled();
  await request(app)
    .get(callback + '?code=example&state=test-state')
    .set('Cookie', flow)
    .expect(303)
    .expect('Location', '/?xcenter=connected');
  await request(app)
    .get(callback + '?code=example&state=test-state')
    .set('Cookie', flow)
    .expect(303)
    .expect('Location', '/?xcenter=failed');
  expect(provider.complete).toHaveBeenCalledOnce();
  expect(
    String((await db.query<{ grant: string }>('SELECT grant FROM xcenter_links'))[0].grant),
  ).not.toContain('fixture-provider-token');
  await request(app).get('/api/xcenter/account').set('Cookie', other).expect(200, { name: null });

  const signIn = cookie(await request(app).post('/api/xcenter/sign-in').set(csrf).expect(200));
  const signedIn = await request(app)
    .get(callback + '?code=example&state=test-state')
    .set('Cookie', signIn)
    .expect(303)
    .expect('Location', '/?xcenter=connected');
  const session = (signedIn.headers['set-cookie'] as unknown as string[])
    .find((value) => value.startsWith('persona_session='))!
    .split(';')[0];
  const me = await request(app).get('/api/auth/me').set('Cookie', session).expect(200);
  expect(me.body.email).toBe('persona-owner@example.test');

  provider.put.mockResolvedValue({ revision: 3 });
  await request(app)
    .put('/api/xcenter/settings')
    .set(csrf)
    .set('Cookie', owner)
    .send({ revision: 2, settings: { appearance: 'dark', autoUpdate: false } })
    .expect(200);
  expect(provider.put).toHaveBeenCalledWith(
    'settings',
    'studio',
    { public: false, data: { appearance: 'dark', autoUpdate: false } },
    expect.objectContaining({ revision: 2 }),
  );

  const { body: portfolio } = await request(app)
    .post('/api/websites')
    .set(csrf)
    .set('Cookie', owner)
    .send({ name: 'Test portfolio', template: 'minimal' })
    .expect(201);
  await request(app)
    .put(`/api/xcenter/portfolios/${portfolio.id}`)
    .set(csrf)
    .set('Cookie', owner)
    .send({ revision: 0 })
    .expect(200);
  expect(provider.put).toHaveBeenCalledWith(
    'portfolios',
    portfolio.id,
    expect.objectContaining({ public: false }),
    expect.objectContaining({ revision: 0 }),
  );
  provider.upload.mockResolvedValue({ id: 'fixture-file' });
  await request(app)
    .post(`/api/xcenter/exports/${portfolio.id}`)
    .set(csrf)
    .set('Cookie', owner)
    .send({ format: 'project' })
    .expect(200, { id: 'fixture-file' });
  const [file] = provider.upload.mock.calls[0];
  const zip = await JSZip.loadAsync(Buffer.from(file.content, 'base64'));
  expect(zip.file('persona.json')).toBeTruthy();
  await request(app).delete('/api/xcenter/account').set(csrf).set('Cookie', owner).expect(200);
  await request(app).get('/api/xcenter/settings').set('Cookie', owner).expect(409);
});
