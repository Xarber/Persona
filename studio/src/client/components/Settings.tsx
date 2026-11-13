import { preferences } from '../preferences';
// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from 'react';
import {
  Settings,
  Shield,
  Code2,
  Lightbulb,
  BookOpen,
  Download,
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  Check,
  LogOut,
  ChevronRight,
  Search,
  ExternalLink,
  FileText,
  PackageOpen,
  PanelsTopLeft,
  Info,
} from 'lucide-react';
import { Workspace, api, download, read, write } from '../storage';
import { ideaSchema, ideasPackage, release, id, type Idea } from '../../shared/schema';
import { Modal, SearchBox, ErrorBox, Empty } from './ui';
declare const __BUILD_COMMIT__: string;
declare const __HOSTED_STUDIO__: boolean;
export function SettingsPage({
  workspace,
  onLogout,
}: {
  workspace: Workspace;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState('general'),
    [dev, setDev] = useState(false),
    [error, setError] = useState(''),
    [analytics, setAnalytics] = useState(false),
    [sessions, setSessions] = useState<
      { id: string; label: string; created_at: string; current: boolean }[]
    >([]),
    [update, setUpdate] = useState<Record<string, unknown> | null>(null),
    [checking, setChecking] = useState(false),
    [auto, setAuto] = useState(preferences.getItem('persona-auto-update') !== 'false'),
    [lastCheck, setLastCheck] = useState(preferences.getItem('persona-last-check') || ''),
    [whatsNew, setWhatsNew] = useState(false);
  const taps = useRef(0),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const previous = preferences.getItem('persona-version');
    if (previous && previous !== release.version) setWhatsNew(true);
    preferences.setItem('persona-version', release.version);
    if (workspace.user) {
      api<{ analytics: boolean }>('/preferences')
        .then((p) => setAnalytics(p.analytics))
        .catch((e) => setError(e.message));
      api<typeof sessions>('/auth/sessions')
        .then(setSessions)
        .catch((e) => setError(e.message));
    }
  }, []);
  const check = async () => {
    if (!workspace.user) {
      setUpdate({ configured: false });
      return;
    }
    setChecking(true);
    try {
      setUpdate(await api('/updates'));
      const stamp = new Date().toISOString();
      setLastCheck(stamp);
      preferences.setItem('persona-last-check', stamp);
      navigator.serviceWorker
        ?.getRegistration()
        .then((r) => r?.update())
        .catch(() => {});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setChecking(false);
    }
  };
  useEffect(() => {
    if (auto && Date.now() - new Date(lastCheck || 0).getTime() > 6 * 3600000) void check();
  }, []);
  useEffect(() => {
    if (!dev) return;
    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setDev(false);
        setTab((t) => (['developer', 'ideas'].includes(t) ? 'general' : t));
        taps.current = 0;
      }, 30000);
    };
    reset();
    window.addEventListener('pointerdown', reset);
    window.addEventListener('keydown', reset);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener('pointerdown', reset);
      window.removeEventListener('keydown', reset);
    };
  }, [dev]);
  return (
    <div className="settings-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">THE WAY YOU MAKE</span>
          <h1>A little housekeeping.</h1>
          <p>Your workspace, your preferences, and the details behind it all.</p>
        </div>
      </div>
      <div className="settings-layout">
        <nav aria-label="Settings categories">
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'privacy', label: 'Privacy & data', icon: Shield },
            { id: 'updates', label: 'Updates', icon: RefreshCw },
            { id: 'changelog', label: 'What’s new', icon: BookOpen },
            ...(dev
              ? [
                  { id: 'developer', label: 'Developer options', icon: Code2 },
                  { id: 'ideas', label: 'Ideas', icon: Lightbulb },
                ]
              : []),
          ].map((t) => (
            <button
              className={tab === t.id ? 'selected' : ''}
              onClick={() => setTab(t.id)}
              key={t.id}
            >
              <t.icon size={16} />
              {t.label}
              <ChevronRight size={12} />
            </button>
          ))}
          {__HOSTED_STUDIO__ ? (
            <span className="version-trigger">Persona {release.version}</span>
          ) : (
            <button
              className="version-trigger"
              onClick={() => {
                taps.current++;
                if (taps.current === 3) {
                  setDev(true);
                  taps.current = 0;
                }
              }}
            >
              Persona {release.version}
              <small>{__BUILD_COMMIT__}</small>
            </button>
          )}
        </nav>
        <div className="settings-content">
          <ErrorBox error={error} />
          {tab === 'general' ? (
            <>
              <h2>A workspace of your own.</h2>
              <p className="muted">
                <a href="/source.zip" download>
                  Download this build’s Corresponding Source (AGPL-3.0-only)
                </a>
              </p>
              <div className="setting-row">
                <div>
                  <strong>Workspace</strong>
                  <p>{workspace.user?.email || 'Local workspace · stored on this device'}</p>
                </div>
                <span className="tiny-badge">{workspace.user ? 'Connected' : 'Local'}</span>
              </div>
              <div className="setting-row">
                <div>
                  <strong>Appearance</strong>
                  <p>Follow your device’s light or dark appearance.</p>
                </div>
                <select
                  aria-label="Appearance"
                  defaultValue={preferences.getItem('persona-appearance') || 'system'}
                  onChange={(e) => {
                    preferences.setItem('persona-appearance', e.target.value);
                    document.documentElement.dataset.appearance =
                      e.target.value === 'system'
                        ? matchMedia('(prefers-color-scheme: dark)').matches
                          ? 'dark'
                          : 'light'
                        : e.target.value;
                  }}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              {workspace.user && (
                <>
                  <AccountSecurity />
                  <h3>Active sessions</h3>
                  {sessions.map((s) => (
                    <div className="session-row" key={s.id}>
                      <div>
                        <strong>{s.current ? 'This browser' : s.label.slice(0, 60)}</strong>
                        <small>{new Date(s.created_at).toLocaleString()}</small>
                      </div>
                      {!s.current && (
                        <button
                          className="secondary"
                          onClick={async () => {
                            try {
                              await api(`/auth/sessions/${s.id}`, 'DELETE');
                              setSessions(sessions.filter((i) => i.id !== s.id));
                            } catch (e) {
                              setError((e as Error).message);
                            }
                          }}
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    className="secondary"
                    onClick={async () => {
                      try {
                        await api('/auth/logout', 'POST', {});
                        onLogout();
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                </>
              )}
            </>
          ) : tab === 'privacy' ? (
            <>
              <h2>Your data belongs to you.</h2>
              <p className="modal-intro">
                No advertising trackers, hidden AI processing, or mandatory public profile. Drafts
                remain private until you publish.
              </p>
              <label className="setting-row">
                <div>
                  <strong>Privacy-friendly page counts</strong>
                  <p>
                    Count public page requests by day and path. No raw IPs, cookies or visitor
                    identifiers are stored. Counts include repeat visits and bots.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={analytics}
                  disabled={!workspace.user}
                  onChange={async (e) => {
                    try {
                      const enabled = e.target.checked;
                      await api('/preferences', 'PUT', { analytics: enabled });
                      setAnalytics(enabled);
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                />
              </label>
              <div className="setting-row">
                <div>
                  <strong>Account export</strong>
                  <p>Download your sites, assets and recorded ideas.</p>
                </div>
                <button
                  className="secondary"
                  disabled={!workspace.user}
                  onClick={() => {
                    location.href = '/api/account/export';
                  }}
                >
                  <Download size={15} />
                  Export
                </button>
              </div>
              <details className="help-details">
                <summary>Storage, retention and backups</summary>
                <p>
                  Local projects live in this browser’s IndexedDB. Clearing browser storage removes
                  them; keep project exports as backups. Connected drafts, revisions, deployments
                  and original assets live on your self-hosted instance. The instance operator
                  controls encrypted backups. Account deletion immediately revokes access and
                  removes database records; physical orphaned files require operator cleanup and
                  backups expire on the operator’s retention schedule.
                </p>
              </details>
              {workspace.user && (
                <div className="danger-zone">
                  <h3>Delete account</h3>
                  <p>
                    This permanently removes your connected sites, domain assignments, sessions,
                    submissions and ideas. Export your data first. Local projects are kept on this
                    device.
                  </p>
                  <button
                    className="secondary danger-text"
                    onClick={async () => {
                      const email = prompt(
                        'Type your account email to permanently delete the account.',
                      );
                      if (!email) return;
                      const password = prompt(
                        'Confirm your password. This action cannot be undone.',
                      );
                      if (!password) return;
                      try {
                        await api('/account', 'DELETE', { email, password });
                        onLogout();
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    <Trash2 size={15} />
                    Delete account permanently
                  </button>
                </div>
              )}
            </>
          ) : tab === 'updates' ? (
            <>
              <h2>Always room to grow.</h2>
              <div className="setting-row">
                <div>
                  <strong>Persona {release.version}</strong>
                  <p>Stable channel{!__HOSTED_STUDIO__ && ` · build ${__BUILD_COMMIT__}`}</p>
                </div>
                <button className="secondary" disabled={checking} onClick={() => void check()}>
                  <RefreshCw size={15} />
                  {checking ? 'Checking…' : 'Check for updates'}
                </button>
              </div>
              <label className="setting-row">
                <div>
                  <strong>Automatically check for updates</strong>
                  <p>Checks are throttled to once every six hours.</p>
                </div>
                <input
                  type="checkbox"
                  checked={auto}
                  onChange={(e) => {
                    setAuto(e.target.checked);
                    preferences.setItem('persona-auto-update', String(e.target.checked));
                  }}
                />
              </label>
              <p className="muted">
                Last successful check:{' '}
                {lastCheck ? new Date(lastCheck).toLocaleString() : 'Not checked yet'}
              </p>
              {update && (
                <div className="notice">
                  <Info size={18} />
                  <div>
                    {update.configured
                      ? String(
                          update.error ||
                            `Update status: ${update.available ? update.tag : 'Your application version is current for this channel.'}`,
                        )
                      : 'Release metadata is not configured on this instance. Browser updates are delivered by the service worker.'}
                    {typeof update.notes === 'string' && (
                      <details>
                        <summary>Latest release notes</summary>
                        <p className="preserve-text">{update.notes}</p>
                      </details>
                    )}
                    {typeof update.url === 'string' && (
                      <a href={update.url} target="_blank" rel="noopener noreferrer">
                        View release <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>
              )}
              <p className="muted">
                Self-hosted application updates are installed by the instance operator. Save your
                open work before applying a browser update.
              </p>
              <button className="text-button" onClick={() => setTab('changelog')}>
                Full changelog <ChevronRight size={14} />
              </button>
            </>
          ) : tab === 'changelog' ? (
            <Changelog developer={dev} />
          ) : tab === 'ideas' ? (
            <Ideas workspace={workspace} />
          ) : (
            <>
              <h2>Behind the canvas.</h2>
              <p className="modal-intro">
                Diagnostics stay free of authentication tokens, visitor messages and private
                document content.
              </p>
              <dl className="diagnostics">
                {Object.entries({
                  Version: release.version,
                  Commit: __BUILD_COMMIT__,
                  Environment: import.meta.env.MODE,
                  'Workspace mode': workspace.user ? 'Authenticated' : 'Local',
                  'Document schema': '1',
                  'Database schema': '1',
                  'Renderer API': '1',
                  Publishing: 'Immutable static artifacts; serial worker',
                  'Component packages': 'Data-only; executable imports rejected',
                  'Asset pipeline': 'Decoded raster → WebP; PDF attachment',
                  Transport: navigator.onLine ? 'Online' : 'Offline',
                  'Service worker': navigator.serviceWorker?.controller
                    ? 'Controlling'
                    : 'Not controlling',
                }).map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <button
                className="secondary"
                onClick={() =>
                  download(
                    JSON.stringify(
                      {
                        version: release.version,
                        commit: __BUILD_COMMIT__,
                        schema: 1,
                        online: navigator.onLine,
                      },
                      null,
                      2,
                    ),
                    'persona-diagnostics.json',
                  )
                }
              >
                <Download size={15} />
                Export diagnostics
              </button>
              <button className="secondary" onClick={() => setTab('ideas')}>
                <Lightbulb size={15} />
                Open Ideas
              </button>
              <Changelog developer />
            </>
          )}
        </div>
      </div>
      {whatsNew && (
        <Modal
          title={`A little more Persona · ${release.version}`}
          onClose={() => setWhatsNew(false)}
        >
          <Changelog />
          <button className="primary" onClick={() => setWhatsNew(false)}>
            Keep making <Check size={15} />
          </button>
        </Modal>
      )}
    </div>
  );
}
export function Changelog({ developer = false }: { developer?: boolean }) {
  return (
    <div className="changelog">
      <span className="eyebrow">MADE BETTER, ONE CHAPTER AT A TIME</span>
      <div className="row between">
        <h2>What’s new.</h2>
        <span className="tiny-badge">v{release.version}</span>
      </div>
      <time>
        {new Date(release.date + 'T12:00:00').toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </time>
      {release.highlights.map((h, i) => (
        <div className="release-highlight" key={h.title}>
          {i ? <PackageOpen size={23} /> : <PanelsTopLeft size={23} />}
          <div>
            <h3>{h.title}</h3>
            <p>{h.description}</p>
          </div>
        </div>
      ))}
      <div className="release-highlight">
        <Check size={20} />
        <div>
          <h3>Fixes & Improvements</h3>
          {release.fixes.map((f) => (
            <p key={f}>{f}</p>
          ))}
        </div>
      </div>
      {!__HOSTED_STUDIO__ && developer && (
        <details className="help-details">
          <summary>Technical build details</summary>
          <p>Document schema 1 · renderer registry 1 · stable channel</p>
          <p>
            Exact build commit: <code>{__BUILD_COMMIT__}</code>
          </p>
          <p>
            Development builds use the “development” marker. Release builds must set BUILD_COMMIT to
            their source SHA. Full commit messages are available in the repository’s Git history.
          </p>
        </details>
      )}
    </div>
  );
}
function Ideas({ workspace }: { workspace: Workspace }) {
  const [ideas, setIdeas] = useState<Idea[]>([]),
    [search, setSearch] = useState(''),
    [filter, setFilter] = useState('all'),
    [sort, setSort] = useState('new'),
    [selected, setSelected] = useState<string[]>([]),
    [edit, setEdit] = useState<Idea | null>(null),
    [incoming, setIncoming] = useState<Idea[] | null>(null),
    [error, setError] = useState('');
  const refresh = () =>
    workspace
      .ideas()
      .then(setIdeas)
      .catch((e) => setError(e.message));
  useEffect(() => {
    void refresh();
    const online = () => void refresh();
    window.addEventListener('online', online);
    return () => window.removeEventListener('online', online);
  }, []);
  const pack = (list: Idea[]) => ({
    schemaVersion: 1,
    project: 'openrecode-persona',
    exportedAt: new Date().toISOString(),
    ideas: list,
  });
  const filtered = ideas
    .filter(
      (i) =>
        (filter === 'all' || i.status === filter) &&
        (i.title + ' ' + i.description).toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === 'title' ? a.title.localeCompare(b.title) : b.updatedAt.localeCompare(a.updatedAt),
    );
  const newIdea = (): Idea => ({
    id: id(),
    title: '',
    description: '',
    category: 'Feature',
    priority: 'Normal',
    status: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    references: [],
  });
  return (
    <>
      <div className="section-toolbar">
        <div>
          <span className="eyebrow">GOOD IDEAS DESERVE A PLACE</span>
          <h2>Ideas for what’s next.</h2>
        </div>
        <button className="primary" onClick={() => setEdit(newIdea())}>
          <Plus size={15} />
          New idea
        </button>
      </div>
      <p className="muted">
        Ideas are saved on this device first. Connected sync preserves conflicts for review; export
        a copy before resolving them.
      </p>
      <p className="muted">
        {ideas.filter((i) => i.status === 'Pending').length} pending ·{' '}
        {ideas.filter((i) => i.status === 'Approved').length} approved ·{' '}
        {ideas.filter((i) => i.status === 'Deferred').length} deferred
      </p>
      <ErrorBox error={error} />
      <div className="ideas-toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Search ideas…" />
        <select
          aria-label="Filter ideas"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {ideaSchema.shape.status.options.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select aria-label="Sort ideas" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="new">Recently changed</option>
          <option value="title">Title</option>
        </select>
      </div>
      <div className="row wrap">
        <button
          className="secondary"
          onClick={() =>
            download(
              JSON.stringify(
                pack(selected.length ? ideas.filter((i) => selected.includes(i.id)) : ideas),
                null,
                2,
              ),
              'persona-ideas.json',
            )
          }
        >
          <Download size={14} />
          Export JSON
        </button>
        <button
          className="secondary"
          onClick={() =>
            download(
              ideas
                .map(
                  (i) =>
                    `## ${i.title}\n\n${i.status} · ${i.category} · ${i.priority}\n\n${i.description}\n\nID: ${i.id}\n`,
                )
                .join('\n'),
              'persona-ideas.md',
              'text/markdown',
            )
          }
        >
          <FileText size={14} />
          Markdown
        </button>
        <label className="secondary import-button">
          Import
          <input
            type="file"
            hidden
            accept=".json"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                if (f.size > 5 * 1024 * 1024) throw Error('Ideas file too large.');
                const parsed = ideasPackage.parse(JSON.parse(await f.text()));
                setIncoming(parsed.ideas);
              } catch (err) {
                setError((err as Error).message);
              }
              e.target.value = '';
            }}
          />
        </label>
        {selected.length > 0 && (
          <select
            aria-label="Change selected idea status"
            value=""
            onChange={async (e) => {
              const status = e.target.value as Idea['status'];
              if (!status) return;
              for (const idea of ideas.filter((i) => selected.includes(i.id)))
                await workspace.saveIdea(
                  { ...idea, status, updatedAt: new Date().toISOString() },
                  true,
                );
              setSelected([]);
              await refresh();
            }}
          >
            <option value="">{selected.length} selected · change status</option>
            {ideaSchema.shape.status.options.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        )}
      </div>
      <div className="idea-list">
        {filtered.map((idea) => (
          <article className="idea-row" key={idea.id}>
            <input
              aria-label={`Select ${idea.title}`}
              type="checkbox"
              checked={selected.includes(idea.id)}
              onChange={(e) =>
                setSelected(
                  e.target.checked ? [...selected, idea.id] : selected.filter((i) => i !== idea.id),
                )
              }
            />
            <button className="idea-summary" onClick={() => setEdit(idea)}>
              <div className="row">
                <span className="tiny-badge">{idea.category}</span>
                <span className="tiny-badge">{idea.status}</span>
                <small>{idea.priority}</small>
              </div>
              <h3>{idea.title}</h3>
              <p>{idea.description}</p>
              <small>Updated {new Date(idea.updatedAt).toLocaleDateString()}</small>
            </button>
            <button
              className="icon-button"
              aria-label="Duplicate idea"
              onClick={async () => {
                await workspace.saveIdea({
                  ...idea,
                  id: id(),
                  title: idea.title + ' copy',
                  status: 'Pending',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                await refresh();
              }}
            >
              <Copy size={15} />
            </button>
            <button
              className="icon-button danger-text"
              aria-label="Delete idea"
              onClick={async () => {
                if (confirm('Permanently delete this idea?')) {
                  await workspace.deleteIdea(idea.id);
                  await refresh();
                }
              }}
            >
              <Trash2 size={15} />
            </button>
          </article>
        ))}
      </div>
      {!ideas.length && (
        <Empty
          title="Leave a note for your future self."
          description="Features, fixes, happy accidents. Capture ideas offline and export them for your next development session."
        />
      )}
      {edit && (
        <Modal
          title={
            ideas.some((i) => i.id === edit.id)
              ? 'A little more about this idea'
              : 'What’s on your mind?'
          }
          onClose={() => setEdit(null)}
        >
          <form
            className="settings-form"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const idea = ideaSchema.parse({ ...edit, updatedAt: new Date().toISOString() });
                await workspace.saveIdea(
                  idea,
                  ideas.some((i) => i.id === idea.id),
                );
                await refresh();
                setEdit(null);
              } catch (err) {
                setError((err as Error).message);
              }
            }}
          >
            <label>
              Title
              <input
                required
                maxLength={300}
                autoFocus
                value={edit.title}
                onChange={(e) => setEdit({ ...edit, title: e.target.value })}
              />
            </label>
            <label>
              Description & reproduction steps
              <textarea
                rows={6}
                value={edit.description}
                onChange={(e) => setEdit({ ...edit, description: e.target.value })}
              />
            </label>
            <div className="field-grid">
              <label>
                Category
                <select
                  value={edit.category}
                  onChange={(e) =>
                    setEdit({ ...edit, category: e.target.value as Idea['category'] })
                  }
                >
                  {ideaSchema.shape.category.options.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <select
                  value={edit.priority}
                  onChange={(e) =>
                    setEdit({ ...edit, priority: e.target.value as Idea['priority'] })
                  }
                >
                  {ideaSchema.shape.priority.options.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Status
              <select
                value={edit.status}
                onChange={(e) => setEdit({ ...edit, status: e.target.value as Idea['status'] })}
              >
                {ideaSchema.shape.status.options.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Implementation references{' '}
              <span className="optional">commits, version, changelog entry; one per line</span>
              <textarea
                value={edit.references.join('\n')}
                onChange={(e) => setEdit({ ...edit, references: e.target.value.split('\n') })}
              />
            </label>
            <p className="muted">
              Mark as Implemented only after verification. Link the release or commit above;
              recording an idea doesn’t publish it.
            </p>
            {edit.history?.length && (
              <details className="help-details">
                <summary>Status history</summary>
                {edit.history.map((entry, index) => (
                  <p key={index}>
                    {new Date(entry.at).toLocaleString()} · {entry.status} · {entry.note}
                  </p>
                ))}
              </details>
            )}
            <button className="primary">
              Save idea <Check size={15} />
            </button>
          </form>
        </Modal>
      )}
      {incoming && (
        <Modal title="Review incoming ideas" onClose={() => setIncoming(null)}>
          <p className="modal-intro">
            {incoming.filter((i) => !ideas.some((e) => e.id === i.id)).length} new ideas.{' '}
            {incoming.filter((i) => ideas.some((e) => e.id === i.id)).length} existing IDs will be
            preserved without overwriting.
          </p>
          <p className="muted">
            Conflicting entries stay as they are. Export the incoming file for manual review; import
            never deletes existing ideas.
          </p>
          <ul>
            {incoming.slice(0, 20).map((i) => (
              <li key={i.id}>
                {i.title} · {ideas.some((e) => e.id === i.id) ? 'Keep existing' : 'Add'}
              </li>
            ))}
          </ul>
          <button
            className="primary"
            onClick={async () => {
              try {
                const seen = new Set(ideas.map((i) => i.id));
                for (const idea of incoming) {
                  if (seen.has(idea.id)) continue;
                  await workspace.saveIdea(idea);
                  seen.add(idea.id);
                }
                await refresh();
                setIncoming(null);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Merge new ideas <Check size={15} />
          </button>
        </Modal>
      )}
    </>
  );
}

function AccountSecurity() {
  const [state, setState] = useState<{
      verified: boolean;
      emailConfigured: boolean;
      passkeys: { id: string; name: string }[];
    } | null>(null),
    [message, setMessage] = useState('');
  const refresh = () => api<any>('/auth/status').then(setState);
  useEffect(() => {
    void refresh().catch((e) => setMessage(e.message));
  }, []);
  return (
    <section className="account-security">
      <h3>Account security</h3>
      <p className="muted">
        Email:{' '}
        {state?.verified
          ? 'Verified'
          : state?.emailConfigured
            ? 'Not yet verified'
            : 'SMTP is not configured on this instance'}
      </p>
      {state?.emailConfigured && !state.verified && (
        <button
          className="secondary"
          onClick={async () => {
            try {
              await api('/auth/verification/request', 'POST', {});
              setMessage('Check your inbox for the verification link.');
            } catch (e) {
              setMessage((e as Error).message);
            }
          }}
        >
          Send verification email
        </button>
      )}
      <div className="setting-row">
        <div>
          <strong>Passkeys</strong>
          <p>Use your device’s secure authenticator. Requires HTTPS or localhost.</p>
        </div>
        <button
          className="secondary"
          onClick={async () => {
            try {
              const { startRegistration } = await import('@simplewebauthn/browser');
              const pack = await api<any>('/auth/passkeys/register/options', 'POST', {});
              const response = await startRegistration({ optionsJSON: pack.options });
              await api('/auth/passkeys/register/verify', 'POST', {
                response,
                challengeId: pack.challengeId,
                name: 'My passkey',
              });
              await refresh();
              setMessage('Passkey added.');
            } catch (e) {
              setMessage((e as Error).message);
            }
          }}
        >
          Add passkey
        </button>
      </div>
      {state?.passkeys.map((k) => (
        <div className="session-row" key={k.id}>
          <strong>{k.name}</strong>
          <button
            className="text-button danger-text"
            onClick={async () => {
              if (!confirm('Remove this passkey? You can still sign in with your password.'))
                return;
              await api('/auth/passkeys/' + encodeURIComponent(k.id), 'DELETE');
              await refresh();
            }}
          >
            Remove
          </button>
        </div>
      ))}
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
    </section>
  );
}
