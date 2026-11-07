// SPDX-License-Identifier: AGPL-3.0-only
import { readdir, readFile, writeFile } from 'node:fs/promises';
import JSZip from 'jszip';
const zip = new JSZip();
async function add(directory: string) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await add(name);
    else if (!entry.isSymbolicLink()) zip.file(name, await readFile(name));
  }
}
for (const dir of ['src', 'scripts', 'public', 'infra', '.github', 'docs']) await add(dir);
for (const file of [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'vitest.config.ts',
  'playwright.config.ts',
  'Dockerfile',
  'compose.yaml',
  'index.html',
  'LICENSE',
  'README.md',
  'AGENTS.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
  '.env.example',
  '.gitignore',
  '.dockerignore',
  '.editorconfig',
  '.gitattributes',
  '.prettierrc.json',
  '.prettierignore',
])
  zip.file(file, await readFile(file));
zip.file(
  'SOURCE_BUILD.json',
  JSON.stringify({ version: '0.1.0', commit: process.env.BUILD_COMMIT || 'development' }, null, 2),
);
await writeFile(
  'dist/source.zip',
  await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }),
);
