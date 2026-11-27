// SPDX-License-Identifier: AGPL-3.0-only
import { createElement, useEffect, useRef, useState } from 'react';
import type { AccountOverview } from '@xcenter-id/web';
import { api, type Workspace } from '../storage';
import { preferences } from '../preferences';
import type { SiteDocument, Website } from '../../shared/schema';

type Config = { enabled: boolean; clientId: string };
type CloudSettings = {
  revision: number;
  settings: { appearance: 'system' | 'light' | 'dark'; autoUpdate: boolean } | null;
};

export function XCenterAccount({ workspace }: { workspace: Workspace }) {
  const [config, setConfig] = useState<Config>();
  const [name, setName] = useState<string | null>(null);
  const [sites, setSites] = useState<Website[]>([]);
  const [siteId, setSiteId] = useState('');
  const [cloudPortfolios, setCloudPortfolios] = useState<{ id: string; name: string }[]>([]);
  const [cloudId, setCloudId] = useState('');
  const [cloudCursor, setCloudCursor] = useState<string | null>();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const card = useRef<AccountOverview>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const config = await api<Config>('/xcenter/config');
      if (!config.enabled || !active) return;
      await import('@xcenter-id/web');
      const [account, sites] = await Promise.all([
        api<{ name: string | null }>('/xcenter/account'),
        workspace.list(),
      ]);
      if (!active) return;
      setName(account.name);
      setSites(sites);
      setSiteId(sites[0]?.id ?? '');
      setConfig(config);
    })().catch(() => {});
    return () => {
      active = false;
    };
  }, [workspace]);

  useEffect(() => {
    if (!config || !card.current) return;
    card.current.profile = name ? { name, username: '' } : null;
    card.current.signIn = async () => {
      const { url } = await api<{ url: string }>('/xcenter/link', 'POST');
      location.assign(url);
    };
    card.current.signOut = async () => {
      if (!confirm('Disconnect X-Center ID from Persona on this account?')) return;
      await api('/xcenter/account', 'DELETE');
      setName(null);
    };
  }, [config, name]);

  async function perform(action: () => Promise<string>) {
    setBusy(true);
    try {
      setStatus(await action());
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!config) return null;
  return (
    <section aria-label="X-Center ID">
      {createElement('xcenter-account-overview', { ref: card, 'client-id': config.clientId })}
      {name && (
        <>
          <div className="setting-row">
            <div>
              <strong>Settings sync</strong>
              <p>Sync appearance and automatic update checks.</p>
            </div>
            <div className="row">
              <button
                disabled={busy}
                onClick={() =>
                  void perform(async () => {
                    const cloud = await api<CloudSettings>('/xcenter/settings');
                    if (cloud.settings && !confirm('Replace the settings copy in X-Center ID?'))
                      return 'Settings were kept.';
                    const appearance = preferences.getItem('persona-appearance');
                    await api('/xcenter/settings', 'PUT', {
                      revision: cloud.revision,
                      settings: {
                        appearance:
                          appearance === 'light' || appearance === 'dark' ? appearance : 'system',
                        autoUpdate: preferences.getItem('persona-auto-update') !== 'false',
                      },
                    });
                    return 'Settings saved to X-Center ID.';
                  })
                }
              >
                Save settings
              </button>
              <button
                disabled={busy}
                onClick={() =>
                  void perform(async () => {
                    const cloud = await api<CloudSettings>('/xcenter/settings');
                    if (!cloud.settings) return 'There are no saved settings.';
                    if (
                      !confirm('Apply the saved appearance and update preferences to this browser?')
                    )
                      return 'Settings were kept.';
                    preferences.setItem('persona-appearance', cloud.settings.appearance);
                    preferences.setItem('persona-auto-update', String(cloud.settings.autoUpdate));
                    location.reload();
                    return 'Settings restored.';
                  })
                }
              >
                Restore settings
              </button>
            </div>
          </div>
          {sites.length > 0 && (
            <fieldset>
              <legend>Portfolios and exports</legend>
              <label>
                Portfolio
                <select
                  value={siteId}
                  onChange={(event) => setSiteId(event.target.value)}
                  disabled={busy}
                >
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="row">
                <button
                  disabled={busy}
                  onClick={() =>
                    void perform(async () => {
                      const path = `/xcenter/portfolios/${siteId}`;
                      const cloud = await api<{ revision: number }>(path);
                      if (cloud.revision && !confirm('Replace the portfolio copy in X-Center ID?'))
                        return 'The saved portfolio was kept.';
                      await api(path, 'PUT', { revision: cloud.revision });
                      return 'Portfolio copy saved. Uploaded media remains in this workspace.';
                    })
                  }
                >
                  Save portfolio copy
                </button>
              </div>
              <div className="row">
                {(['static', 'project'] as const).map((format) => (
                  <button
                    key={format}
                    disabled={busy}
                    onClick={() =>
                      void perform(async () => {
                        await api(`/xcenter/exports/${siteId}`, 'POST', { format });
                        return 'Export saved to your X-Center ID Files.';
                      })
                    }
                  >
                    {format === 'static'
                      ? 'Save website ZIP to Files'
                      : 'Save project ZIP to Files'}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <fieldset>
            <legend>Restore a portfolio</legend>
            <button
              disabled={busy}
              onClick={() =>
                void perform(async () => {
                  const path = cloudCursor
                    ? `/xcenter/portfolios?cursor=${encodeURIComponent(cloudCursor)}`
                    : '/xcenter/portfolios';
                  const page = await api<{
                    portfolios: { id: string; name: string }[];
                    nextCursor?: string | null;
                  }>(path);
                  setCloudPortfolios(page.portfolios);
                  setCloudId(page.portfolios[0]?.id || '');
                  setCloudCursor(page.nextCursor ?? null);
                  return page.portfolios.length
                    ? 'Saved copies loaded.'
                    : 'No saved portfolio copies found.';
                })
              }
            >
              {cloudCursor ? 'Load next page' : 'Load saved portfolios'}
            </button>
            {cloudPortfolios.length > 0 && (
              <div className="row">
                <label>
                  Saved portfolio
                  <select
                    value={cloudId}
                    disabled={busy}
                    onChange={(event) => setCloudId(event.target.value)}
                  >
                    {cloudPortfolios.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  disabled={busy}
                  onClick={() =>
                    void perform(async () => {
                      const cloud = await api<{ document: SiteDocument | null }>(
                        `/xcenter/portfolios/${cloudId}`,
                      );
                      if (!cloud.document) return 'The saved portfolio is no longer available.';
                      const restored = await workspace.create(
                        cloud.document.name,
                        'blank',
                        undefined,
                        cloud.document,
                      );
                      setSites(await workspace.list());
                      setSiteId(restored.id);
                      return 'A separate portfolio was restored to your workspace.';
                    })
                  }
                >
                  Restore as a copy
                </button>
              </div>
            )}
          </fieldset>
        </>
      )}
      <p role="status">{busy ? 'Working…' : status}</p>
    </section>
  );
}
