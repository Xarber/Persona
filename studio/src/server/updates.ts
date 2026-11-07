// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { z } from 'zod';
import { selectRelease, type ReleaseChannel } from '../shared/updates';
import { release } from '../shared/schema';
const releaseSchema = z
  .array(
    z.object({
      tag_name: z.string(),
      html_url: z.url(),
      body: z.string().nullable(),
      prerelease: z.boolean(),
      draft: z.boolean(),
    }),
  )
  .max(30);
let cache: { key: string; checkedAt: string; value: Record<string, unknown> } | null = null;
export async function checkUpdates() {
  const repo = process.env.UPDATE_REPOSITORY,
    channel: ReleaseChannel = process.env.RELEASE_CHANNEL === 'beta' ? 'beta' : 'stable';
  if (!repo || !/^[-\w.]+\/[-\w.]+$/.test(repo))
    return { configured: false, version: release.version, channel };
  const key = repo + channel;
  if (cache?.key === key && Date.now() - Date.parse(cache.checkedAt) < 10 * 60000)
    return { ...cache.value, cached: true };
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=30`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Persona/' + release.version,
        ...(process.env.UPDATE_GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.UPDATE_GITHUB_TOKEN}` }
          : {}),
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw Error('Release metadata is temporarily unavailable.');
    const releases = releaseSchema.parse(await response.json());
    const candidate = selectRelease(releases, release.version, channel);
    const checkedAt = new Date().toISOString();
    const value = {
      configured: true,
      available: !!candidate,
      version: release.version,
      channel,
      checkedAt,
      stale: false,
      ...(candidate
        ? {
            tag: candidate.tag_name,
            url: candidate.html_url,
            notes: String(candidate.body || '').slice(0, 10000),
            prerelease: candidate.prerelease,
          }
        : {}),
    };
    cache = { key, checkedAt, value };
    return value;
  } catch {
    return {
      ...(cache?.key === key
        ? cache.value
        : { configured: true, available: false, version: release.version, channel }),
      stale: true,
      error: 'Release metadata is temporarily unavailable. Cached information may be outdated.',
    };
  }
}
