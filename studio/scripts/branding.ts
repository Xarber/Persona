// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
const svg = await readFile('public/branding/icon.svg');
for (const size of [192, 512])
  await sharp(svg).resize(size, size).png().toFile(`public/branding/icon-${size}.png`);
await sharp(svg).resize(180, 180).png().toFile('public/branding/apple-touch-icon.png');
await sharp(svg)
  .resize(384, 384)
  .extend({ top: 64, bottom: 64, left: 64, right: 64, background: '#1d4b3e' })
  .png()
  .toFile('public/branding/maskable-512.png');
