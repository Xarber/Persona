// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { it, expect } from 'vitest';
import {
  parseVersion,
  compareVersions,
  selectRelease,
  type ReleaseCandidate,
} from '../src/shared/updates';
const candidate = (tag_name: string, prerelease = false): ReleaseCandidate => ({
  tag_name,
  prerelease,
  draft: false,
  html_url: 'https://github.com/example/app/releases/tag/' + tag_name,
  body: '',
});
it('compares numeric versions and prereleases rather than publication dates', () => {
  expect(compareVersions('1.10.0', '1.9.0')).toBe(1);
  expect(compareVersions('1.0.0', '1.0.0-rc.2')).toBe(1);
  expect(compareVersions('1.0.0-beta.11', '1.0.0-beta.2')).toBe(1);
  expect(parseVersion('sources-v1.0')).toBeNull();
});
it('keeps channels distinct, rejects drafts, metadata and downgrades', () => {
  const releases = [
    candidate('sources-v1.0'),
    candidate('v1.0.1'),
    candidate('v2.0.0-beta.1', true),
    { ...candidate('v9.0.0'), draft: true },
  ];
  expect(selectRelease(releases, '1.0.0', 'stable')?.tag_name).toBe('v1.0.1');
  expect(selectRelease(releases, '1.0.0', 'beta')?.tag_name).toBe('v2.0.0-beta.1');
  expect(selectRelease(releases, '2.0.0', 'stable')).toBeUndefined();
});
