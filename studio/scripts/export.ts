// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { writeFile } from 'node:fs/promises';
import { migrate, query, closeDb } from '../src/server/db';
import { staticArchive } from '../src/server/publisher';
const [siteId, output = 'persona-static.zip'] = process.argv.slice(2);
if (!siteId) throw Error('Usage: npm run export -- WEBSITE_ID output.zip');
await migrate();
const [site] = await query<{ document: string; user_id: string }>(
  'SELECT document,user_id FROM websites WHERE id=?',
  [siteId],
);
if (!site) throw Error('Website not found');
await writeFile(output, await staticArchive(JSON.parse(site.document), site.user_id));
console.log(`Exported ${output}`);
await closeDb();
