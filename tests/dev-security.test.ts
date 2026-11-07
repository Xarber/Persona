// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { it, expect } from 'vitest';
import { createServer } from 'vite';
import express from 'express';
import request from 'supertest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
it('denies private runtime files through both Vite URL forms', async () => {
  const directory = path.resolve('.data'),
    name = `dev-security-${crypto.randomUUID()}.txt`,
    filename = path.join(directory, name),
    marker = 'DISPOSABLE-PRIVATE-TEST-MARKER';
  await mkdir(directory, { recursive: true });
  await writeFile(filename, marker);
  const server = await createServer({
    configFile: 'vite.config.ts',
    server: { middlewareMode: true, watch: null },
    logLevel: 'silent',
  });
  const app = express();
  app.use(server.middlewares);
  try {
    for (const url of [`/.data/${name}`, `/@fs/${filename}`]) {
      const response = await request(app).get(url).expect(403);
      expect(response.text).not.toContain(marker);
    }
    await request(app).get('/branding/icon.svg').expect(200);
  } finally {
    await server.close();
    await rm(filename);
  }
});
