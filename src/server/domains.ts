// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { resolveTxt, resolveCname } from 'node:dns/promises';
import { query, run } from './db';
let running = false;
export async function revalidateDomains() {
  if (running) return;
  running = true;
  try {
    const rows = await query<{ id: string; hostname: string; token: string }>(
      'SELECT id,hostname,token FROM domains WHERE verified_at IS NOT NULL AND verified_at<? ORDER BY verified_at LIMIT 25',
      [new Date(Date.now() - 86400000).toISOString()],
    );
    for (const d of rows) {
      let verified = false,
        routing = false;
      try {
        verified = (await resolveTxt(`_persona.${d.hostname}`)).some(
          (parts) => parts.join('') === d.token,
        );
        routing = (await resolveCname(d.hostname)).some(
          (v) => v.replace(/\.$/, '') === process.env.DOMAIN_TARGET,
        );
      } catch {}
      await run('UPDATE domains SET verified_at=?,routing=? WHERE id=?', [
        verified ? new Date().toISOString() : null,
        Number(routing),
        d.id,
      ]);
    }
  } finally {
    running = false;
  }
}
export async function maintenance() {
  await revalidateDomains();
  const now = new Date().toISOString();
  await run('DELETE FROM sessions WHERE expires_at<?', [now]);
  await run('DELETE FROM auth_tokens WHERE expires_at<?', [now]);
  await run('DELETE FROM analytics WHERE day<?', [
    new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10),
  ]);
  await run('DELETE FROM submissions WHERE created_at<?', [
    new Date(Date.now() - 90 * 86400000).toISOString(),
  ]);
}
