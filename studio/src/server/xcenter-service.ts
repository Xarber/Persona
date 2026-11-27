// SPDX-License-Identifier: AGPL-3.0-only
import { createServiceClient } from '@xcenter-id/server/data';
import { XCenterError } from '@xcenter-id/client';
import { pathToFileURL } from 'node:url';

const version = '0.1.0';

export async function recordHostedDeployment(
  service: ReturnType<typeof createServiceClient>,
  environment: string,
  commit: string,
) {
  if (!/^[a-f0-9]{40}$/.test(commit) || !/^[a-z][a-z0-9_-]{0,31}$/.test(environment))
    throw new Error('A deployment environment and exact source commit are required.');
  const id = `${environment}_${commit}`;
  try {
    await service.records.put(
      'deployments',
      id,
      { public: false, data: { environment, commit, version } },
      { revision: 0, signal: AbortSignal.timeout(15_000) },
    );
  } catch (error) {
    if (!(error instanceof XCenterError) || error.status !== 409) throw error;
    const prior = await service.records.get('deployments', id, {
      signal: AbortSignal.timeout(15_000),
    });
    if (
      prior.public ||
      typeof prior.data !== 'object' ||
      !prior.data ||
      Array.isArray(prior.data) ||
      prior.data.commit !== commit ||
      prior.data.environment !== environment ||
      prior.data.version !== version
    )
      throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const service = createServiceClient({ file: false });
    await recordHostedDeployment(
      service,
      process.env.PERSONA_DEPLOYMENT_ENV || '',
      process.env.BUILD_COMMIT || '',
    );
    console.log('Private deployment record verified.');
  } catch {
    console.error(
      'Could not record deployment. Check the verified app key and deployment metadata.',
    );
    process.exitCode = 1;
  }
}
