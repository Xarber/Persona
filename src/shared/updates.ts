// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
export type ReleaseChannel = 'stable' | 'beta';
export interface ReleaseCandidate {
  tag_name: string;
  html_url: string;
  body: string | null;
  prerelease: boolean;
  draft: boolean;
}
export function parseVersion(tag: string) {
  const match = tag.match(/^v?(\d+)\.(\d+)\.(\d+)(?:-(beta|rc)\.(\d+))?$/);
  if (!match) return null;
  return [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    match[4] === 'beta' ? 0 : match[4] === 'rc' ? 1 : 2,
    Number(match[5] || 0),
  ];
}
export function compareVersions(a: string, b: string) {
  const left = parseVersion(a),
    right = parseVersion(b);
  if (!left || !right) return 0;
  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) return left[index] > right[index] ? 1 : -1;
  }
  return 0;
}
export function selectRelease(
  releases: ReleaseCandidate[],
  current: string,
  channel: ReleaseChannel,
) {
  return releases
    .filter(
      (release) =>
        !release.draft &&
        parseVersion(release.tag_name) &&
        !release.tag_name.startsWith('sources-') &&
        (channel === 'beta' || (!release.prerelease && parseVersion(release.tag_name)![3] === 2)),
    )
    .sort((a, b) => compareVersions(b.tag_name, a.tag_name))
    .find((release) => compareVersions(release.tag_name, current) > 0);
}
