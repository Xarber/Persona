// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const names = (await readdir('dist/assets')).map((n) => '/assets/' + n);
const version = createHash('sha256')
  .update(
    (await Promise.all(names.map((n) => readFile('dist' + n)))).map((b) => b.toString()).join(''),
  )
  .digest('hex')
  .slice(0, 12);
await writeFile(
  'dist/sw.js',
  `const CACHE='persona-editor-${version}';const SHELL=['/',${names.map((n) => JSON.stringify(n)).join(',')},'/manifest.webmanifest','/branding/icon.svg','/branding/icon-192.png','/branding/icon-512.png','/branding/maskable-512.png'];self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL))));self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting()});self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('persona-editor-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin||u.pathname.startsWith('/api/'))return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match('/')));return;}if(SHELL.includes(u.pathname))e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});`,
);
