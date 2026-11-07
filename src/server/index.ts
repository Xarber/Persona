// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { maintenance } from './domains';
import { migrate } from './db';
import { createApp, createPublicApp } from './app';
import { tick, recoverJobs } from './publisher';
import express from 'express';
import path from 'node:path';
await migrate();
const port = Number(process.env.PORT || 3100);
const app = createApp();
if (process.env.NODE_ENV === 'production') {
  if (
    !process.env.APP_ORIGIN ||
    !process.env.PUBLIC_ORIGIN ||
    new URL(process.env.APP_ORIGIN).origin === new URL(process.env.PUBLIC_ORIGIN).origin
  )
    throw Error('Production requires separate APP_ORIGIN and PUBLIC_ORIGIN.');
  app.use(express.static('dist', { index: false }));
  app.get(/.*/, (_req, res) => res.sendFile(path.resolve('dist/index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}
app.listen(port, '0.0.0.0', () => console.log(`Persona editor: http://localhost:${port}`));
createPublicApp().listen(Number(process.env.PUBLIC_PORT || 3101), '0.0.0.0', () =>
  console.log('Persona public delivery: ' + (process.env.PUBLIC_ORIGIN || 'http://localhost:3101')),
);
if (process.env.EXTERNAL_WORKER !== 'true') {
  await recoverJobs();
  void maintenance().catch(console.error);
  setInterval(() => void maintenance().catch(console.error), 6 * 3600000);
  setInterval(() => void tick().catch(console.error), 1000);
}
