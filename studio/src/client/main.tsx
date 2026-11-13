import { preferences } from './preferences';
// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowUpRight,
  LayoutGrid,
  LayoutList,
  LayoutTemplate,
  FolderOpen,
  Settings,
  Plus,
  Search,
  ArrowDownUp,
  Globe,
  MoreHorizontal,
  Copy,
  Archive,
  Trash2,
  Download,
  LogIn,
  PanelTop,
  ChevronDown,
  BookOpen,
  RefreshCw,
  Check,
  CloudOff,
} from 'lucide-react';
import { Workspace, api, download, localExport, type User, read, write, remove } from './storage';
import { type Website, parseDocument, release } from '../shared/schema';
import { Editor } from './components/Editor';
import { SettingsPage, Changelog } from './components/Settings';
import { Assets } from './components/Assets';
import { CreateSite, TemplateGallery, Thumbnail } from './components/Templates';
import { Modal, Empty, NewButton, SearchBox, ErrorBox } from './components/ui';
import './styles.css';
import { WebEntry } from './components/WebEntry';
import './components/landing.css';
const appearance = preferences.getItem('persona-appearance') || 'system';
document.documentElement.dataset.appearance =
  appearance === 'system'
    ? matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
    : appearance;
export const notify = (message: string) =>
  window.dispatchEvent(new CustomEvent('persona-notify', { detail: message }));
function App({ onShowLanding }: { onShowLanding: () => void }) {
  const [user, setUser] = useState<User | null>(null),
    [loaded, setLoaded] = useState(false),
    [view, setView] = useState('websites'),
    [sites, setSites] = useState<Website[]>([]),
    [activeSite, setActiveSite] = useState<Website | null>(null),
    [create, setCreate] = useState(false),
    [whatsNew, setWhatsNew] = useState(false),
    [auth, setAuth] = useState(false),
    [search, setSearch] = useState(''),
    [filter, setFilter] = useState('all'),
    [sort, setSort] = useState('recent'),
    [grid, setGrid] = useState(true),
    [toast, setToast] = useState(''),
    [error, setError] = useState(''),
    [online, setOnline] = useState(navigator.onLine),
    [swUpdate, setSwUpdate] = useState<ServiceWorker | null>(null),
    [authLink, setAuthLink] = useState<{ mode: string; token: string } | null>(null);
  useEffect(() => {
    const previous = preferences.getItem('persona-version');
    if (previous && previous !== release.version) setWhatsNew(true);
    preferences.setItem('persona-version', release.version);
  }, []);
  useEffect(() => {
    if (!loaded || !user) return;
    let checking = false;
    const check = async () => {
      if (
        checking ||
        preferences.getItem('persona-auto-update') === 'false' ||
        !navigator.onLine ||
        Date.now() - Date.parse(preferences.getItem('persona-last-check') || '1970-01-01') <
          6 * 3600000
      )
        return;
      checking = true;
      try {
        const result = await api<{ available?: boolean; tag?: string; stale?: boolean }>(
          '/updates',
        );
        if (!result.stale) preferences.setItem('persona-last-check', new Date().toISOString());
        if (result.available && !result.stale)
          notify(
            `Persona ${result.tag} is available. Read the release notes in Settings → Updates.`,
          );
        await navigator.serviceWorker?.getRegistration().then((r) => r?.update());
      } catch {
      } finally {
        checking = false;
      }
    };
    void check();
    const foreground = () => {
      if (document.visibilityState === 'visible') void check();
    };
    document.addEventListener('visibilitychange', foreground);
    return () => document.removeEventListener('visibilitychange', foreground);
  }, [loaded, user]);
  const workspace = useMemo(() => new Workspace(user), [user]);
  const refresh = async () => {
    try {
      setSites(await workspace.list());
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  };
  useEffect(() => {
    api<User>('/auth/me')
      .then(async (u) => {
        setUser(u);
        await write('cached-user', u);
      })
      .catch(async () => {
        if (!navigator.onLine) {
          const cached = await read<User>('cached-user');
          if (cached) setUser(cached);
        }
      })
      .finally(() => setLoaded(true));
  }, []);
  useEffect(() => {
    if (loaded) void refresh();
  }, [loaded, workspace]);
  useEffect(() => {
    const handler = (e: Event) => {
      setToast((e as CustomEvent).detail);
    };
    window.addEventListener('persona-notify', handler);
    const a = () => setOnline(navigator.onLine);
    window.addEventListener('online', a);
    window.addEventListener('offline', a);
    return () => {
      window.removeEventListener('persona-notify', handler);
      window.removeEventListener('online', a);
      window.removeEventListener('offline', a);
    };
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    void navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        if (reg.waiting) setSwUpdate(reg.waiting);
        reg.addEventListener('updatefound', () => {
          reg.installing?.addEventListener('statechange', () => {
            if (reg.waiting && navigator.serviceWorker.controller) setSwUpdate(reg.waiting);
          });
        });
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!loaded) return;
    const load = () => {
      if (document.documentElement.dataset.entryView === 'landing') return;
      const link = location.hash.match(/^#(verify|reset)\/([A-Za-z0-9_-]+)$/);
      if (link) {
        setAuthLink({ mode: link[1], token: link[2] });
        return;
      }
      const match = location.hash.match(/^#site\/([\w-]+)$/);
      if (match)
        workspace
          .get(match[1])
          .then(setActiveSite)
          .catch((e) => notify(e.message));
      else setActiveSite(null);
    };
    load();
    window.addEventListener('hashchange', load);
    return () => window.removeEventListener('hashchange', load);
  }, [workspace, loaded]);
  async function exportSite(site: Website, project = false) {
    try {
      if (user) location.href = `/api/websites/${site.id}/export/${project ? 'project' : 'static'}`;
      else await localExport(site.document, project);
    } catch (e) {
      notify((e as Error).message);
    }
  }
  async function importProject(file: File) {
    try {
      if (user) {
        const form = new FormData();
        form.set('file', file);
        const site = await api<Website>('/import', 'POST', form);
        await refresh();
        location.hash = `site/${site.id}`;
      } else {
        const { default: JSZip } = await import('jszip');
        if (file.size > 40 * 1024 * 1024) throw Error('Package is too large.');
        const zip = await JSZip.loadAsync(file);
        const entry = zip.file('persona.json');
        if (!entry) throw Error('This is not an editable Persona project.');
        if (
          ((entry as unknown as { _data: { uncompressedSize: number } })._data?.uncompressedSize ||
            0) >
          4 * 1024 * 1024
        )
          throw Error('Document is too large.');
        const pkg = JSON.parse(await entry.async('string'));
        if (pkg.schemaVersion !== 1 || pkg.format !== 'persona-project')
          throw Error('Unsupported package version.');
        let documentText = JSON.stringify(parseDocument(pkg.document));
        if (!Array.isArray(pkg.assets) || pkg.assets.length > 100)
          throw Error('Invalid asset manifest.');
        const { addLocalAsset } = await import('./media');
        for (const a of pkg.assets) {
          if (!/^[a-f0-9-]{36}$/.test(a.id)) throw Error('Invalid asset ID.');
          const entry = zip.file(`assets/${a.id}`);
          if (!entry || ((entry as any)._data?.uncompressedSize || 0) > 12 * 1024 * 1024)
            throw Error('Invalid asset size.');
          const bytes = await entry.async('arraybuffer');
          const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
          if (digest !== a.sha256) throw Error('Asset checksum mismatch.');
          const saved = await addLocalAsset(new Blob([bytes], { type: a.mime }), 'Imported asset');
          documentText = documentText.replaceAll(
            `/api/assets/${a.id}/file`,
            `/api/assets/${saved.id}/file`,
          );
        }
        const doc = parseDocument(JSON.parse(documentText));
        const site = await workspace.create(doc.name, 'blank', undefined, doc);
        await refresh();
        location.hash = `site/${site.id}`;
      }
    } catch (e) {
      notify((e as Error).message);
    }
  }
  const visible = sites
    .filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) &&
        (view === 'archive' ? s.archived : !s.archived) &&
        (filter === 'all' ||
          (filter === 'published' && s.deploymentId) ||
          (filter === 'draft' && !s.deploymentId)),
    )
    .sort((a, b) =>
      sort === 'name' ? a.name.localeCompare(b.name) : b.updatedAt.localeCompare(a.updatedAt),
    );
  if (!loaded)
    return (
      <div className="app-loading">
        <img src="/branding/icon.svg" alt="" />
        <p>Making room for your ideas…</p>
      </div>
    );
  return (
    <>
      {activeSite ? (
        <Editor
          key={activeSite.id + workspace.key}
          initial={activeSite}
          workspace={workspace}
          onBack={() => {
            location.hash = '';
            setActiveSite(null);
            void refresh();
          }}
          onExport={exportSite}
          onShowLanding={onShowLanding}
        />
      ) : (
        <div className="app-shell">
          <aside className="app-sidebar">
            <a
              className="brand"
              href="/"
              aria-label="Persona home"
              onClick={(event) => {
                event.preventDefault();
                onShowLanding();
              }}
            >
              <img src="/branding/icon.svg" alt="" />
              <span>
                persona<span className="brand-dot">.</span>
              </span>
            </a>
            <button className="workspace-switch" onClick={() => setAuth(true)}>
              <span className="avatar">{user ? user.email[0].toUpperCase() : 'Y'}</span>
              <span>
                <strong>{user ? 'Your workspace' : 'Local workspace'}</strong>
                <small>{user ? 'Personal space' : 'On this device'}</small>
              </span>
              <ChevronDown size={14} />
            </button>
            <div className="nav-label">WORKSPACE</div>
            <nav aria-label="Main navigation">
              {[
                {
                  id: 'websites',
                  label: 'My websites',
                  icon: PanelTop,
                  count: sites.filter((s) => !s.archived).length,
                },
                { id: 'templates', label: 'Templates', icon: LayoutTemplate },
                { id: 'assets', label: 'Asset library', icon: FolderOpen },
                { id: 'archive', label: 'Archive', icon: Archive },
              ].map((n) => (
                <button
                  key={n.id}
                  className={view === n.id ? 'selected' : ''}
                  onClick={() => setView(n.id)}
                >
                  <n.icon size={17} />
                  <span>{n.label}</span>
                  {n.count !== undefined && <small>{n.count}</small>}
                </button>
              ))}
            </nav>
            <div className="sidebar-note">
              <span className="note-icon">✳</span>
              <strong>
                Your work.
                <br />
                Your rules.
              </strong>
              <p>No subscriptions. No limits on your imagination.</p>
              <a
                href="/"
                onClick={(event) => {
                  event.preventDefault();
                  onShowLanding();
                }}
              >
                Meet Persona <ArrowUpRight size={13} />
              </a>
            </div>
            <div className="sidebar-bottom">
              <button
                className={view === 'settings' ? 'selected' : ''}
                onClick={() => setView('settings')}
              >
                <Settings size={17} />
                Settings
              </button>
              <button onClick={() => setAuth(true)}>
                <LogIn size={17} />
                {user ? 'Account & sessions' : 'Sign in / create account'}
              </button>
              <span className="openrecode">
                PART OF <b>OpenRecode ↗</b>
              </span>
            </div>
          </aside>
          <div className="app-main">
            <header className="app-header">
              <div className="breadcrumb">
                Workspace <span>/</span>{' '}
                <strong>
                  {view === 'websites' ? 'My websites' : view[0].toUpperCase() + view.slice(1)}
                </strong>
              </div>
              <div className="header-status">
                <span className={'status-dot ' + (!online ? 'offline' : '')} />
                {!online ? 'Offline' : user ? 'Connected workspace' : 'Saved on this device'}
                <span className="avatar small-avatar">
                  {user ? user.email[0].toUpperCase() : 'Y'}
                </span>
              </div>
            </header>
            <main className="dashboard-main">
              {!online && (
                <div className="notice">
                  <CloudOff size={16} />
                  Local drafts remain available. Publishing needs a connection.
                </div>
              )}
              {view === 'websites' || view === 'archive' ? (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">YOUR SPACE ON THE WEB</div>
                      <h1>
                        {view === 'archive' ? 'A pause, not an ending.' : 'Make yourself at home.'}
                      </h1>
                      <p>
                        {view === 'archive'
                          ? 'Your archived websites. Restore one whenever you’re ready.'
                          : 'A place for your work, your ideas, and whatever comes next.'}
                      </p>
                    </div>
                    <NewButton onClick={() => setCreate(true)} />
                  </div>
                  {!user && (
                    <div className="local-banner">
                      <div>
                        <span className="local-symbol">
                          <Globe size={19} />
                        </span>
                        <div>
                          <strong>Your ideas start here.</strong>
                          <p>
                            Build freely in a local workspace. Create an account when you’re ready
                            to publish.
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setAuth(true)}>
                        Connect a workspace <ArrowUpRight size={16} />
                      </button>
                    </div>
                  )}
                  <div className="section-toolbar">
                    <div className="row">
                      <h2>{view === 'archive' ? 'Archived websites' : 'My websites'}</h2>
                      <span className="count-badge">{visible.length}</span>
                    </div>
                    <div className="toolbar-actions">
                      <label className="text-button import-button">
                        <Download size={15} />
                        Import
                        <input
                          type="file"
                          accept=".zip"
                          hidden
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void importProject(f);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <SearchBox value={search} onChange={setSearch} />
                      <select
                        aria-label="Filter websites"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        <option value="all">All statuses</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </select>
                      <select
                        aria-label="Sort websites"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                      >
                        <option value="recent">Last edited</option>
                        <option value="name">Name A–Z</option>
                      </select>
                      <div className="segmented">
                        <button
                          className={grid ? 'active' : ''}
                          aria-label="Grid view"
                          onClick={() => setGrid(true)}
                        >
                          <LayoutGrid size={16} />
                        </button>
                        <button
                          className={!grid ? 'active' : ''}
                          aria-label="List view"
                          onClick={() => setGrid(false)}
                        >
                          <LayoutList size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <ErrorBox error={error} />
                  <div className={grid ? 'website-grid' : 'website-list'}>
                    {visible.map((site) => (
                      <article className="website-card" key={site.id}>
                        <button
                          className="website-preview"
                          aria-label={`Edit ${site.name}`}
                          onClick={() => {
                            location.hash = `site/${site.id}`;
                          }}
                        >
                          <Thumbnail doc={site.document} template={site.document.template} />
                          <span className="edit-overlay">
                            Open editor <ArrowUpRight size={16} />
                          </span>
                        </button>
                        <div className="website-info">
                          <div className="row between">
                            <button
                              className="site-name"
                              onClick={() => {
                                location.hash = `site/${site.id}`;
                              }}
                            >
                              {site.name}
                            </button>
                            <details className="action-menu">
                              <summary aria-label={`Actions for ${site.name}`}>
                                <MoreHorizontal size={18} />
                              </summary>
                              <div>
                                <button
                                  onClick={() => {
                                    const name = prompt('Rename website', site.name);
                                    if (name)
                                      void workspace
                                        .save(site, { ...site.document, name })
                                        .then(refresh)
                                        .catch((e) => notify(e.message));
                                  }}
                                >
                                  Rename
                                </button>
                                <button
                                  onClick={() =>
                                    void workspace
                                      .create(site.name + ' copy', 'blank', undefined, {
                                        ...site.document,
                                        name: site.name + ' copy',
                                      })
                                      .then(refresh)
                                      .catch((e) => notify(e.message))
                                  }
                                >
                                  <Copy size={14} />
                                  Duplicate
                                </button>
                                <button onClick={() => void exportSite(site)}>
                                  Export static website
                                </button>
                                <button onClick={() => void exportSite(site, true)}>
                                  Export editable project
                                </button>
                                <button
                                  onClick={() =>
                                    void workspace
                                      .save(site, site.document, !site.archived)
                                      .then(refresh)
                                      .catch((e) => notify(e.message))
                                  }
                                >
                                  <Archive size={14} />
                                  {site.archived ? 'Restore' : 'Archive'}
                                </button>
                                <button
                                  className="danger-text"
                                  onClick={() => {
                                    if (
                                      prompt(
                                        `Permanently delete this website? Type “${site.name}” to confirm.`,
                                      ) === site.name
                                    )
                                      void workspace
                                        .delete(site)
                                        .then(refresh)
                                        .catch((e) => notify(e.message));
                                  }}
                                >
                                  <Trash2 size={14} />
                                  Delete permanently
                                </button>
                              </div>
                            </details>
                          </div>
                          <div className="site-meta">
                            <span
                              className={'site-status ' + (site.deploymentId ? 'published' : '')}
                            >
                              <span />
                              {site.archived
                                ? 'Archived'
                                : site.deploymentId
                                  ? site.version === site.publishedVersion
                                    ? 'Published'
                                    : 'Unpublished changes'
                                  : 'Draft'}
                            </span>
                            <time dateTime={site.updatedAt}>
                              Edited{' '}
                              {new Date(site.updatedAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </time>
                          </div>
                        </div>
                      </article>
                    ))}
                    {view === 'websites' && (
                      <button className="new-site-card" onClick={() => setCreate(true)}>
                        <span>
                          <Plus size={25} />
                        </span>
                        <strong>A new possibility</strong>
                        <p>Create your next website</p>
                      </button>
                    )}
                  </div>
                  {!visible.length && view === 'archive' && (
                    <Empty
                      title="Nothing tucked away yet."
                      description="Archived websites will appear here."
                    />
                  )}
                  <section className="starter-section">
                    <div className="section-toolbar">
                      <div>
                        <span className="eyebrow">A LITTLE INSPIRATION</span>
                        <h2>Find your starting point.</h2>
                      </div>
                      <button className="text-button" onClick={() => setView('templates')}>
                        Explore all templates <ArrowUpRight size={15} />
                      </button>
                    </div>
                    <TemplateGallery onSelect={() => setCreate(true)} />
                  </section>
                  <div className="dashboard-footer">
                    <span>Build something that feels like you.</span>
                    <span>Independent by design. ✳</span>
                  </div>
                </>
              ) : view === 'templates' ? (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">START SOMEWHERE BEAUTIFUL</span>
                      <h1>A canvas for every kind of you.</h1>
                      <p>Six considered starting points. Every detail is yours to change.</p>
                    </div>
                  </div>
                  <TemplateGallery onSelect={() => setCreate(true)} />
                </>
              ) : view === 'assets' ? (
                <Assets workspace={workspace} />
              ) : view === 'settings' ? (
                <SettingsPage
                  workspace={workspace}
                  onLogout={() => {
                    void remove('cached-user');
                    void remove(`cached-sites:${workspace.key}`);
                    setUser(null);
                    notify('Signed out. Your local workspace is available.');
                  }}
                />
              ) : (
                <div className="about-page">
                  <span className="empty-symbol">✳</span>
                  <h1>Your work. Your identity. Your web.</h1>
                  <p>
                    Persona is an independent, self-hostable portfolio studio. Create freely,
                    express yourself, and take your website wherever you want.
                  </p>
                  <p>
                    Built as part of OpenRecode. AGPL-3.0-only. No advertisements, no forced
                    branding, and no mandatory subscription.
                  </p>
                  <button className="primary" onClick={() => setCreate(true)}>
                    Start making <ArrowUpRight size={16} />
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>
      )}
      {create && (
        <CreateSite
          onClose={() => setCreate(false)}
          onCreate={async (name, t, person) => {
            const site = await workspace.create(name, t, person);
            setCreate(false);
            location.hash = `site/${site.id}`;
            await refresh();
          }}
        />
      )}
      {whatsNew && (
        <Modal
          title={`A little more Persona · ${release.version}`}
          onClose={() => setWhatsNew(false)}
        >
          <Changelog />
          <button className="primary" onClick={() => setWhatsNew(false)}>
            Keep making
          </button>
          <button
            className="text-button"
            onClick={() => {
              setWhatsNew(false);
              setView('settings');
            }}
          >
            Full changelog in Settings
          </button>
        </Modal>
      )}
      {authLink && (
        <AuthLink
          mode={authLink.mode}
          token={authLink.token}
          onClose={() => {
            setAuthLink(null);
            location.hash = '';
          }}
        />
      )}
      {auth && (
        <AuthModal
          user={user}
          onClose={() => setAuth(false)}
          onUser={(u) => {
            void write('cached-user', u);
            setUser(u);
            setAuth(false);
            notify(
              'Workspace connected. Local websites remain on this device; export and import them to transfer.',
            );
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast('')}
          >
            ×
          </button>
        </div>
      )}
      {swUpdate && (
        <div className="pwa-update">
          <RefreshCw size={18} />
          <div>
            <strong>A fresh version is ready.</strong>
            <p>Save your work, then reload to update. View changes in Settings → Changelog.</p>
          </div>
          <button
            onClick={() => {
              if (confirm('Reload Persona? Save open edits first.')) {
                navigator.serviceWorker.addEventListener(
                  'controllerchange',
                  () => location.reload(),
                  { once: true },
                );
                swUpdate.postMessage({ type: 'SKIP_WAITING' });
              }
            }}
          >
            Update / reload
          </button>
          <button aria-label="Later" onClick={() => setSwUpdate(null)}>
            ×
          </button>
        </div>
      )}
    </>
  );
}
function AuthModal({
  user,
  onUser,
  onClose,
}: {
  user: User | null;
  onUser: (u: User) => void;
  onClose: () => void;
}) {
  const [register, setRegister] = useState(false),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <Modal
      title={
        user ? 'Your connected workspace' : register ? 'Make room for your work.' : 'Welcome back.'
      }
      onClose={onClose}
    >
      {user ? (
        <>
          <p className="modal-intro">You’re signed in as {user.email}.</p>
          <p className="muted">Manage sessions, privacy, and data export in Settings.</p>
          <button className="primary" onClick={onClose}>
            Back to making
          </button>
        </>
      ) : (
        <form
          className="auth-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const u = await api<User>(`/auth/${register ? 'register' : 'login'}`, 'POST', {
                email,
                password,
              });
              onUser(u);
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <p className="modal-intro">
            {register
              ? 'A private workspace for your websites, assets and ideas.'
              : 'Sign in to manage and publish your websites.'}
          </p>
          <label>
            Email address
            <input
              autoFocus
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              minLength={12}
              maxLength={256}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={register ? 'new-password' : 'current-password'}
            />
            <small>At least 12 characters.</small>
          </label>
          <ErrorBox error={error} />
          {!register && (
            <button
              className="text-button"
              type="button"
              onClick={async () => {
                try {
                  const { startAuthentication } = await import('@simplewebauthn/browser');
                  const pack = await api<any>('/auth/passkeys/login/options', 'POST', {});
                  const response = await startAuthentication({ optionsJSON: pack.options });
                  onUser(
                    await api<User>('/auth/passkeys/login/verify', 'POST', {
                      challengeId: pack.challengeId,
                      response,
                    }),
                  );
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Sign in with a passkey
            </button>
          )}
          <button className="primary" disabled={busy}>
            {busy ? 'Connecting…' : register ? 'Create account' : 'Sign in'}
            <ArrowUpRight size={16} />
          </button>
          <button className="text-button" type="button" onClick={() => setRegister(!register)}>
            {register ? 'Already have an account? Sign in' : 'New here? Create an account'}
          </button>
          {!register && (
            <button
              className="text-button"
              type="button"
              onClick={async () => {
                if (!email) {
                  setError('Enter your email address first.');
                  return;
                }
                try {
                  await api('/auth/password/request', 'POST', { email });
                  setError('If the account exists, a recovery email has been sent.');
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Forgot password?
            </button>
          )}
          <p className="fine-print">
            Local drafts stay on this device. Registration does not automatically upload them.
          </p>
        </form>
      )}
    </Modal>
  );
}
function AuthLink({ mode, token, onClose }: { mode: string; token: string; onClose: () => void }) {
  const [password, setPassword] = useState(''),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  return (
    <Modal
      title={mode === 'verify' ? 'Verify your email' : 'Choose a new password'}
      onClose={onClose}
    >
      <form
        className="settings-form"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api(
              mode === 'verify' ? '/auth/verification/confirm' : '/auth/password/reset',
              'POST',
              { token, ...(mode === 'reset' ? { password } : {}) },
            );
            setMessage(
              mode === 'verify'
                ? 'Your email is verified.'
                : 'Password changed. Sign in again with your new password.',
            );
            history.replaceState(null, '', '/');
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        {mode === 'reset' && (
          <label>
            New password
            <input
              type="password"
              minLength={12}
              maxLength={256}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        )}
        <ErrorBox error={error} />
        {message ? (
          <>
            <p role="status">{message}</p>
            <button type="button" className="primary" onClick={onClose}>
              Done
            </button>
          </>
        ) : (
          <button className="primary">
            {mode === 'verify' ? 'Confirm email' : 'Reset password'}
          </button>
        )}
      </form>
    </Modal>
  );
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WebEntry>{(onShowLanding) => <App onShowLanding={onShowLanding} />}</WebEntry>
  </React.StrictMode>,
);
